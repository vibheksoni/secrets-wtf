document.addEventListener('DOMContentLoaded', async () => {
    const input = document.querySelector('#listing-filter');
    const cards = Array.from(document.querySelectorAll('.listing-card, .listing-row'));
    const empty = document.querySelector('#empty-state');

    const setCount = (name, value) => {
        document.querySelectorAll(`[data-live-count="${name}"]`).forEach((node) => {
            node.textContent = value;
        });
    };

    try {
        const [ollamaResponse, lmstudioResponse] = await Promise.all([
            fetch('/data/hosts/ollama.json', { cache: 'no-store' }),
            fetch('/data/hosts/lmstudio.json', { cache: 'no-store' }),
        ]);
        const [ollamaHosts, lmstudioHosts] = await Promise.all([
            ollamaResponse.json(),
            lmstudioResponse.json(),
        ]);
        const ollamaCount = Array.isArray(ollamaHosts) ? ollamaHosts.length : 0;
        const lmstudioCount = Array.isArray(lmstudioHosts) ? lmstudioHosts.length : 0;
        setCount('ollama', ollamaCount);
        setCount('lmstudio', lmstudioCount);
        setCount('total', ollamaCount + lmstudioCount);
    } catch {
        // Keep the static fallback counts in the HTML.
    }

    if (!input || !cards.length || !empty) return;

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        let shown = 0;

        cards.forEach((card) => {
            const haystack = `${card.dataset.name || ''} ${card.dataset.tags || ''} ${card.textContent || ''}`.toLowerCase();
            const match = !query || haystack.includes(query);
            card.hidden = !match;
            if (match) shown += 1;
        });

        empty.hidden = shown !== 0;
    });
});
