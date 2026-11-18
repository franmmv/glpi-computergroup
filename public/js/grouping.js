(() => {
    'use strict';

    const preference = 'glpi-computergroup-default:' + location.pathname;
    const spanish = document.documentElement.lang.startsWith('es');
    const labels = spanish ? {
        group: 'Agrupar por ubicación y estado',
        expand: 'Desplegar todos los grupos',
        collapse: 'Contraer todos los grupos',
        settings: 'Preferencias de agrupación',
        defaultView: 'Usar como vista predeterminada',
        error: 'No se pudo cargar la agrupación. Puedes volver a intentarlo.',
    } : {
        group: 'Group by location and status',
        expand: 'Expand all groups',
        collapse: 'Collapse all groups',
        settings: 'Grouping preferences',
        defaultView: 'Use as default view',
        error: 'The grouped view could not be loaded. Please try again.',
    };
    const buttons = {
        group: 'M4 5h16M4 9h16M8 13h12M8 17h12M8 21h12M4 9v8h1',
        expand: 'm6 7 6 6 6-6m-12 6 6 6 6-6',
        collapse: 'm6 17 6-6 6 6m-12-6 6-6 6 6',
        settings: 'M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4m-6 2v4',
    };
    const svg = (name) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${buttons[name]}"/></svg>`;

    function defaultView() {
        try {
            return localStorage.getItem(preference) === '1';
        } catch {
            return false;
        }
    }

    function toggleGroup(button) {
        const expanded = button.getAttribute('aria-expanded') === 'false';
        const locationId = button.getAttribute('aria-controls');
        if (locationId) {
            document.getElementById(locationId).classList.toggle('d-none', !expanded);
        } else {
            let row = button.closest('tr').nextElementSibling;
            while (row?.hasAttribute('data-group-computer')) {
                row.classList.toggle('d-none', !expanded);
                row = row.nextElementSibling;
            }
        }
        button.setAttribute('aria-expanded', String(expanded));
        button.firstElementChild.className = expanded ? 'ti ti-chevron-down' : 'ti ti-chevron-right';
    }

    function updateGroupButton(control, results) {
        const hasGroups = Boolean(results?.querySelector('[data-group-toggle]'));
        const allExpanded = hasGroups && !results.querySelector('[data-group-toggle][aria-expanded="false"]');
        const action = allExpanded ? 'collapse' : 'expand';
        control.classList.toggle('d-none', !hasGroups);
        control.querySelector('path').setAttribute('d', buttons[action]);
        control.setAttribute('aria-label', labels[action]);
        control.title = labels[action];
    }

    $(function () {
        if (!location.pathname.endsWith('/front/computer.php')) {
            return;
        }

        let enabled = defaultView();
        let pending;
        let hidden = [];
        let results;

        function restore() {
            pending?.abort();
            pending = undefined;
            results?.remove();
            results = undefined;
            hidden.forEach((element) => element.classList.remove('d-none'));
            hidden = [];
        }

        async function showGrouped(card, expand, error) {
            restore();
            updateGroupButton(expand, results);
            error.hidden = true;
            card.removeAttribute('aria-busy');
            if (!enabled) {
                return;
            }

            const request = new AbortController();
            pending = request;
            const url = new URL(CFG_GLPI.root_doc + '/plugins/computergroup/grouped-computers', location.origin);
            const nativeParams = new URLSearchParams(location.search);
            if (!nativeParams.has('reset')) {
                for (const [key, value] of nativeParams) {
                    if (/^(criteria|metacriteria|sort|order)(\[|$)|^(is_deleted|nodefault)$/.test(key)) {
                        url.searchParams.append(key, value);
                    }
                }
            }

            card.setAttribute('aria-busy', 'true');
            try {
                const response = await fetch(url, {signal: request.signal});
                if (!response.ok) {
                    throw new Error('Grouped search failed');
                }
                const fragment = document.createElement('template');
                fragment.innerHTML = await response.text();
                if (request.signal.aborted || !card.isConnected) {
                    return;
                }
                const grouped = fragment.content.firstElementChild;
                if (!grouped?.hasAttribute('data-computergroup-results')) {
                    throw new Error('Invalid grouped search response');
                }
                grouped.addEventListener('click', (event) => {
                    const button = event.target.closest('[data-group-toggle]');
                    if (button) {
                        toggleGroup(button);
                        updateGroupButton(expand, grouped);
                    }
                });
                hidden = [...card.querySelectorAll('form.masssearchform, .search-footer, .massiveactions-control')]
                    .filter((element) => !element.classList.contains('d-none'));
                hidden.forEach((element) => element.classList.add('d-none'));
                card.append(grouped);
                results = grouped;
                updateGroupButton(expand, grouped);
            } catch {
                if (!request.signal.aborted) {
                    error.hidden = false;
                }
            } finally {
                if (pending === request) {
                    pending = undefined;
                    card.removeAttribute('aria-busy');
                }
            }
        }

        function mount() {
            const table = document.querySelector('form[data-search-itemtype="Computer"] table.search-results');
            const card = table?.closest('.search-card');
            const toolbar = card?.querySelector('.secondary-controls');
            if (!toolbar || toolbar.querySelector('[data-computergroup-toolbar], [data-computer-grouping], [data-computer-group-by]')) {
                return;
            }

            const controls = document.createElement('div');
            controls.dataset.computergroupToolbar = '';
            controls.className = 'btn-group me-1 me-xl-2 shadow-none';
            controls.innerHTML = `
                <input type="checkbox" class="btn-check" id="computergroup-toggle" autocomplete="off" aria-label="${labels.group}">
                <label for="computergroup-toggle" class="btn btn-icon btn-sm btn-pill btn-ghost-secondary px-2 py-1"
                       title="${labels.group}">${svg('group')}</label>
                <button type="button" class="btn btn-icon btn-sm btn-pill btn-ghost-secondary px-2 py-1 d-none"
                        data-expand aria-label="${labels.expand}" title="${labels.expand}">${svg('expand')}</button>
                <div class="dropdown">
                    <button type="button" class="btn btn-icon btn-sm btn-pill btn-ghost-secondary px-2 py-1 rounded-start-0"
                            data-bs-toggle="dropdown" aria-expanded="false" aria-label="${labels.settings}"
                            title="${labels.settings}">${svg('settings')}</button>
                    <div class="dropdown-menu dropdown-menu-end">
                        <label class="dropdown-item">
                            <input type="checkbox" class="form-check-input me-2" data-default>
                            ${labels.defaultView}
                        </label>
                    </div>
                </div>`;
            toolbar.prepend(controls);

            const checkbox = controls.querySelector('#computergroup-toggle');
            const expand = controls.querySelector('[data-expand]');
            const defaultCheckbox = controls.querySelector('[data-default]');
            const error = document.createElement('p');
            error.className = 'text-danger mx-3 my-2';
            error.setAttribute('role', 'status');
            error.textContent = labels.error;
            error.hidden = true;
            card.append(error);

            checkbox.checked = enabled;
            checkbox.addEventListener('change', () => {
                enabled = checkbox.checked;
                showGrouped(card, expand, error);
            });
            defaultCheckbox.checked = defaultView();
            defaultCheckbox.addEventListener('change', () => {
                try {
                    localStorage.setItem(preference, defaultCheckbox.checked ? '1' : '0');
                } catch {
                    defaultCheckbox.checked = defaultView();
                }
            });
            expand.addEventListener('click', () => {
                if (!results) {
                    return;
                }
                const expanded = !results.querySelector('[data-group-toggle][aria-expanded="false"]');
                results.querySelectorAll(`[data-group-toggle][aria-expanded="${expanded}"]`).forEach(toggleGroup);
                updateGroupButton(expand, results);
            });
            showGrouped(card, expand, error);
        }

        $(document).on('search_refresh', '.search-results', mount);
        mount();
    });
})();
