document.addEventListener('DOMContentLoaded', async () => {
    const table = document.querySelector('#host-table');
    const filterInput = document.querySelector('#host-filter');

    if (!table || !table.dataset.hosts) return;

    const pageSize = Number(table.dataset.pageSize || 20);
    const modelLimit = 48;

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

    const modelsMarkup = (models, modelCount) => {
        const list = Array.isArray(models) ? models.filter(Boolean) : [];
        const count = modelCount || list.length || 0;
        const label = `${count} model${count === 1 ? '' : 's'}`;

        if (!list.length) return { label, detail: '' };

        const chips = list
            .slice(0, modelLimit)
            .map((model) => `<span>${escapeHtml(model)}</span>`)
            .join('');
        const overflow = count > modelLimit ? `<em>+${count - modelLimit} more</em>` : '';

        return { label, detail: `<div class="model-list">${chips}${overflow}</div>` };
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
        table.querySelectorAll('.host-data-row, .empty-host').forEach((row) => row.remove());
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
        table.querySelectorAll('.host-data-row, .empty-host').forEach((row) => row.remove());

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

        rows.forEach((host, index) => {
            const models = modelsMarkup(host.models, host.modelCount);
            const row = document.createElement('details');
            row.className = 'host-data-row';
            row.dataset.endpoint = host.endpoint;
            row.dataset.origin = host.origin || 'index';
            row.innerHTML = `
                <summary class="host-row">
                    <span class="host-endpoint">
                        <a href="${escapeHtml(host.endpoint)}" rel="nofollow noopener" target="_blank">${escapeHtml(host.endpoint)}</a>
                </span>
                    <span class="models-cell">${escapeHtml(models.label)}</span>
                    <span class="host-status">${escapeHtml(host.status || 'online')}</span>
                </summary>
                <div class="host-row-detail" id="host-models-${currentPage}-${index}">
                    ${models.detail || '<span class="models-empty">No model names listed.</span>'}
                </div>
            `;
            fragment.append(row);
        });

        table.append(fragment);
        updatePagination();
    };

    try {
        const response = await fetch(table.dataset.hosts, { cache: 'no-store' });
        const data = await response.json();
        hosts = Array.isArray(data) ? data : Array.isArray(data.hosts) ? data.hosts : [];
        render();
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

    table.addEventListener('click', (event) => {
        if (event.target.closest('.host-endpoint a')) {
            event.stopPropagation();
        }
    }, true);

});
