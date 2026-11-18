<?php

function plugin_init_computergroup(): void
{
    global $PLUGIN_HOOKS;

    $PLUGIN_HOOKS[Glpi\Plugin\Hooks::ADD_JAVASCRIPT]['computergroup'] = 'js/grouping.js';
}

function plugin_version_computergroup(): array
{
    return [
        'name' => 'Agrupación de ordenadores',
        'version' => '1.0.4',
        'author' => 'Fran M.',
        'license' => 'GPL-3.0-or-later',
        'requirements' => ['glpi' => ['min' => '12.0.2', 'max' => '12.0.3']],
    ];
}
