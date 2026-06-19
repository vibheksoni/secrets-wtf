document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('[data-site-nav]');
    if (!nav) return;

    const links = [
        { href: '/#ai-infra', label: 'Listings' },
        { href: '/listings/ollama/', label: 'Ollama' },
        { href: '/listings/lm-studio/', label: 'LM Studio' },
        { href: 'https://opendoors.wtf/', label: 'OpenDoors', rel: 'me', external: true },
    ];

    const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');

    nav.replaceChildren(...links.map((link) => {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = link.label;
        if (link.rel) anchor.rel = link.rel;
        if (link.external) {
            anchor.target = '_blank';
            anchor.rel = `${anchor.rel ? `${anchor.rel} ` : ''}noopener`.trim();
        }
        if (!link.external && currentPath === link.href.replace(/#.*$/, '')) {
            anchor.setAttribute('aria-current', 'page');
        }
        if (link.external) {
            anchor.insertAdjacentHTML('beforeend', `
                <svg class="external-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d="M5 3h8v8h-2V6.41l-6.3 6.3-1.4-1.42L9.59 5H5V3z"></path>
                </svg>
            `);
        }
        return anchor;
    }));
});
