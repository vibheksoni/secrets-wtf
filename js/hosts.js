document.addEventListener('DOMContentLoaded', async () => {
    const table = document.querySelector('#host-table');
    const filterInput = document.querySelector('#host-filter');
    const addForm = document.querySelector('#host-add-form');
    const endpointInput = document.querySelector('#host-endpoint-input');
    const modelsInput = document.querySelector('#host-models-input');
    const exportLocalButton = document.querySelector('#export-local-hosts');
    const importLocalInput = document.querySelector('#import-local-hosts');
    const clearLocalButton = document.querySelector('#clear-local-hosts');
    const stateNote = document.querySelector('#host-state-note');
    const contribPanel = document.querySelector('.contrib-panel');

    if (!table || !table.dataset.hosts) return;

    const service = table.dataset.service || 'hosts';
    const defaultPort = Number(contribPanel?.dataset.defaultPort || 80);
    const localStorageKey = `secrets.wtf:${service}:local-hosts`;
    const pageSize = Number(table.dataset.pageSize || 20);
    const modelLimit = 48;

    let builtInHosts = [];
    let localHosts = [];
    let hosts = [];
    let filteredHosts = [];
    let currentPage = 1;

    const pagination = document.createElement('div');
    pagination.className = 'host-pagination';
    pagination.innerHTML = `
        <button class="button small secondary" type="button" data-page-action="prev">Prev</button>
        <span class="page-status">0 hosts</span>
        <button class="button small secondary" type="button" data-page-action="next">Next</button>
    `;
    table.insertAdjacentElement('afterend', pagination);

    const pageStatus = pagination.querySelector('.page-status');
    const prevPageButton = pagination.querySelector('[data-page-action="prev"]');
    const nextPageButton = pagination.querySelector('[data-page-action="next"]');

    const escapeHtml = (value) => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const updateNote = (message) => {
        if (!stateNote) return;
        const count = localHosts.length;
        stateNote.textContent = message || `${count} added host${count === 1 ? '' : 's'} in this browser.`;
    };

    const normalizeEndpoint = (value) => {
        const trimmed = String(value || '').trim();
        if (!trimmed) return null;
        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
        let url;
        try {
            url = new URL(withProtocol);
        } catch {
            return null;
        }
        if (!url.hostname) return null;
        if (!url.port) url.port = String(defaultPort);
        url.pathname = '';
        url.search = '';
        url.hash = '';
        return {
            endpoint: url.href.replace(/\/$/, ''),
            host: url.hostname,
            port: Number(url.port || defaultPort),
        };
    };

    const parseModels = (value) => String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, modelLimit);

    const hostKey = (host) => `${host.endpoint}`.toLowerCase();

    const modelsMarkup = (models, modelCount) => {
        const list = Array.isArray(models) ? models.filter(Boolean) : [];
        const count = modelCount || list.length || 0;
        const label = `${count} model${count === 1 ? '' : 's'}`;

        if (!list.length) {
            return `<span class="models-count">${label}</span>`;
        }

        const chips = list
            .slice(0, modelLimit)
            .map((model) => `<span>${escapeHtml(model)}</span>`)
            .join('');
        const overflow = count > modelLimit ? `<em>+${count - modelLimit} more</em>` : '';

        return `
            <details class="models-details">
                <summary>${label}</summary>
                <div class="model-list">${chips}${overflow}</div>
            </details>
        `;
    };

    const readLocalHosts = () => {
        try {
            const stored = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
            return Array.isArray(stored) ? stored : [];
        } catch {
            return [];
        }
    };

    const saveLocalHosts = () => {
        localStorage.setItem(localStorageKey, JSON.stringify(localHosts, null, 2));
    };

    const mergeHosts = () => {
        const merged = new Map();
        builtInHosts.forEach((host) => merged.set(hostKey(host), { ...host, origin: 'index' }));
        localHosts.forEach((host) => merged.set(hostKey(host), { ...host, origin: 'added' }));
        hosts = Array.from(merged.values());
    };

    const pageCount = () => Math.max(1, Math.ceil(filteredHosts.length / pageSize));

    const updatePagination = () => {
        const pages = pageCount();
        currentPage = Math.min(Math.max(currentPage, 1), pages);
        const start = filteredHosts.length ? (currentPage - 1) * pageSize + 1 : 0;
        const end = Math.min(currentPage * pageSize, filteredHosts.length);
        pageStatus.textContent = `${start}-${end} of ${filteredHosts.length} hosts`;
        prevPageButton.disabled = currentPage <= 1 || !filteredHosts.length;
        nextPageButton.disabled = currentPage >= pages || !filteredHosts.length;
    };

    const setStatus = (message) => {
        table.querySelectorAll('.host-row:not(.host-head)').forEach((row) => row.remove());
        const row = document.createElement('div');
        row.className = 'host-row empty-host';
        row.innerHTML = `
            <span>${escapeHtml(message)}</span>
            <span>-</span>
            <span>-</span>
        `;
        table.append(row);
    };

    const render = () => {
        const query = (filterInput?.value || '').trim().toLowerCase();
        table.querySelectorAll('.host-row:not(.host-head)').forEach((row) => row.remove());

        filteredHosts = hosts.filter((host) => {
            if (!query) return true;
            return [
                host.endpoint,
                host.host,
                host.port,
                host.status,
                host.origin,
                ...(host.models || []),
            ].join(' ').toLowerCase().includes(query);
        });

        updatePagination();

        if (!filteredHosts.length) {
            setStatus('no matching hosts');
            return;
        }

        const start = (currentPage - 1) * pageSize;
        const rows = filteredHosts.slice(start, start + pageSize);
        const fragment = document.createDocumentFragment();

        rows.forEach((host) => {
            const row = document.createElement('div');
            row.className = 'host-row host-data-row';
            row.dataset.endpoint = host.endpoint;
            row.dataset.origin = host.origin || 'index';
            row.innerHTML = `
                <span class="host-endpoint">
                    <a href="${escapeHtml(host.endpoint)}" rel="nofollow noopener" target="_blank">${escapeHtml(host.endpoint)}</a>
                    ${host.origin === 'added' ? '<em>added</em>' : ''}
                </span>
                <span class="models-cell">${modelsMarkup(host.models, host.modelCount)}</span>
                <span class="host-status">${escapeHtml(host.status || 'online')}</span>
            `;
            fragment.append(row);
        });

        table.append(fragment);
        updatePagination();
    };

    const addHost = (event) => {
        event.preventDefault();
        const normalized = normalizeEndpoint(endpointInput?.value);
        if (!normalized) {
            updateNote('Enter a valid host.');
            return;
        }

        const models = parseModels(modelsInput?.value);
        const row = {
            ...normalized,
            status: 'added',
            modelCount: models.length,
            models,
        };
        const existing = localHosts.findIndex((host) => hostKey(host) === hostKey(row));
        if (existing >= 0) localHosts[existing] = row;
        else localHosts.push(row);
        if (endpointInput) endpointInput.value = '';
        if (modelsInput) modelsInput.value = '';
        saveLocalHosts();
        mergeHosts();
        render();
        updateNote();
    };

    const exportLocalHosts = () => {
        const blob = new Blob([JSON.stringify(localHosts, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${service}-added-hosts.json`;
        link.click();
        URL.revokeObjectURL(url);
        updateNote('Exported added hosts.');
    };

    const importLocalHosts = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const imported = JSON.parse(await file.text());
            const rows = Array.isArray(imported) ? imported : Array.isArray(imported.hosts) ? imported.hosts : [];
            rows.forEach((host) => {
                const normalized = normalizeEndpoint(host.endpoint || `${host.host || ''}:${host.port || defaultPort}`);
                if (!normalized) return;
                const models = Array.isArray(host.models) ? host.models.slice(0, modelLimit) : [];
                const row = {
                    ...normalized,
                    status: host.status || 'added',
                    modelCount: host.modelCount || models.length,
                    models,
                };
                const existing = localHosts.findIndex((item) => hostKey(item) === hostKey(row));
                if (existing >= 0) localHosts[existing] = row;
                else localHosts.push(row);
            });
            saveLocalHosts();
            mergeHosts();
            render();
            updateNote(`Imported ${rows.length} host row${rows.length === 1 ? '' : 's'}.`);
        } catch {
            updateNote('Import failed.');
        } finally {
            event.target.value = '';
        }
    };

    try {
        const response = await fetch(table.dataset.hosts, { cache: 'no-store' });
        const data = await response.json();
        builtInHosts = Array.isArray(data) ? data : Array.isArray(data.hosts) ? data.hosts : [];
        localHosts = readLocalHosts();
        mergeHosts();
        render();
        updateNote();
    } catch {
        setStatus('failed to load hosts');
    }

    filterInput?.addEventListener('input', () => {
        currentPage = 1;
        render();
    });

    pagination.addEventListener('click', (event) => {
        const button = event.target.closest('[data-page-action]');
        if (!button) return;
        if (button.dataset.pageAction === 'prev') currentPage -= 1;
        if (button.dataset.pageAction === 'next') currentPage += 1;
        render();
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    addForm?.addEventListener('submit', addHost);
    exportLocalButton?.addEventListener('click', exportLocalHosts);
    importLocalInput?.addEventListener('change', importLocalHosts);
    clearLocalButton?.addEventListener('click', () => {
        localHosts = [];
        saveLocalHosts();
        mergeHosts();
        render();
        updateNote('Cleared added hosts.');
    });
});
