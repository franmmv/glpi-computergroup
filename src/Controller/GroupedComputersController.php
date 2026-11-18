<?php

namespace GlpiPlugin\Computergroup\Controller;

use Computer;
use Dropdown;
use Glpi\Application\View\TemplateRenderer;
use Glpi\DependencyInjection\PublicService;
use Glpi\Exception\Http\AccessDeniedHttpException;
use Location;
use Search;
use Session;
use State;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class GroupedComputersController implements PublicService
{
    #[Route('/grouped-computers', name: 'grouped_computers', methods: ['GET'])]
    public function __invoke(Request $request): Response
    {
        global $DB;

        Session::checkCentralAccess();
        if (!Computer::canView()) {
            throw new AccessDeniedHttpException();
        }
        Computer::checkReAuthenticationOrRedirect();

        // Keep the native search filters and sort. Ignore all caller-supplied output and scope parameters.
        $keys = array_flip(['criteria', 'metacriteria', 'sort', 'order', 'is_deleted', 'nodefault']);
        $params = array_intersect_key($request->query->all(), $keys)
            + array_intersect_key($_SESSION['glpisearch'][Computer::class] ?? [], $keys);
        // GLPI may write defaults even with usesession=false. Keep the native table's session intact.
        $saved_search = $_SESSION['glpisearch'][Computer::class] ?? null;
        try {
            $params = Search::manageParams(Computer::class, $params, false);
            $data = Search::getDatas(Computer::class, array_replace($params, [
                'display_type' => Search::HTML_OUTPUT,
                'export_all' => 1,
                'start' => 0,
            ]));
        } finally {
            if ($saved_search === null) {
                unset($_SESSION['glpisearch'][Computer::class]);
            } else {
                $_SESSION['glpisearch'][Computer::class] = $saved_search;
            }
        }

        if (!isset($data['data']['totalcount'])) {
            return new Response('', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $rows = $data['data']['rows'] ?? [];
        $fields = [];
        // Only look up attributes for IDs already returned by the permission-scoped GLPI search.
        foreach (array_chunk(array_column($rows, 'id'), 500) as $ids) {
            foreach ($DB->request([
                'SELECT' => ['id', 'locations_id', 'states_id'],
                'FROM' => Computer::getTable(),
                'WHERE' => ['id' => $ids],
            ]) as $computer) {
                $fields[(int) $computer['id']] = $computer;
            }
        }

        $groups = [];
        $location_names = [0 => __('None')];
        $state_names = [0 => __('None')];
        foreach ($rows as $row) {
            $computer = $fields[(int) $row['id']] ?? [];
            $location = (int) ($computer['locations_id'] ?? 0);
            $state = (int) ($computer['states_id'] ?? 0);
            $location_names[$location] ??= Dropdown::getDropdownName(Location::getTable(), $location, tooltip: false, default: __('None'));
            $state_names[$state] ??= Dropdown::getDropdownName(State::getTable(), $state, tooltip: false, default: __('None'));
            $groups[$location]['name'] = $location_names[$location];
            $groups[$location]['count'] = ($groups[$location]['count'] ?? 0) + 1;
            $groups[$location]['states'][$state]['name'] = $state_names[$state];
            $groups[$location]['states'][$state]['rows'][] = $row;
        }
        $by_name = static fn(array $a, array $b): int => strnatcasecmp($a['name'], $b['name']);
        uasort($groups, $by_name);
        foreach ($groups as &$group) {
            uasort($group['states'], $by_name);
        }
        unset($group);

        return new Response(
            TemplateRenderer::getInstance()->render('@computergroup/grouped.html.twig', [
                'columns' => $data['data']['cols'] ?? [],
                'groups' => $groups,
            ]),
            headers: ['Cache-Control' => 'no-store'],
        );
    }
}
