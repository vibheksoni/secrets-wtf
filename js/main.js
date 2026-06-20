document.addEventListener('DOMContentLoaded', async () => {
    const input = document.querySelector('#listing-filter');
    const cards = Array.from(document.querySelectorAll('.listing-card, .listing-row'));
    const empty = document.querySelector('#empty-state');
    const canvas = document.querySelector('[data-dither-canvas]');

    const initDitherCanvas = (target) => {
        if (!target) return;

        const ctx = target.getContext('2d', { alpha: false });
        if (!ctx) return;

        const settings = target.dataset;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const host = target.closest('.hero-visual') || target;
        const bayer = [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5],
        ];

        let width = 0;
        let height = 0;
        let frame = 0;
        let phase = 0;
        let lastTime = 0;

        const config = {
            cellSize: Number(settings.cellSize || 9),
            minSpeed: Number(settings.minSpeed || 0.0009),
            maxSpeed: Number(settings.maxSpeed || 0.003),
            idleNoise: Number(settings.noise || 0.28),
            activeNoise: Number(settings.activeNoise || 0.48),
            pointerInfluence: Number(settings.pointerInfluence || 0.6),
            scrollInfluence: Number(settings.scrollInfluence || 0.25),
        };

        const motion = {
            pointerX: 0.5,
            pointerY: 0.5,
            pointerTarget: 0,
            pointerCurrent: 0,
            scrollTarget: 0,
            scrollCurrent: 0,
            speed: config.minSpeed,
            noise: config.idleNoise,
        };

        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const lerp = (from, to, amount) => from + ((to - from) * amount);

        const resize = () => {
            const rect = target.getBoundingClientRect();
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = Math.max(1, Math.floor(rect.width * ratio));
            height = Math.max(1, Math.floor(rect.height * ratio));
            target.width = width;
            target.height = height;
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        };

        const updateScrollTarget = () => {
            const rect = host.getBoundingClientRect();
            const viewportCenter = window.innerHeight / 2;
            const componentCenter = rect.top + (rect.height / 2);
            const distance = Math.abs(componentCenter - viewportCenter);
            motion.scrollTarget = clamp(1 - (distance / Math.max(window.innerHeight * 0.8, 1)), 0, 1);
        };

        const updateMotion = (time = 0) => {
            const delta = lastTime ? Math.min(time - lastTime, 48) : 16;
            lastTime = time;

            motion.pointerTarget *= 0.94;
            motion.pointerCurrent = lerp(motion.pointerCurrent, motion.pointerTarget, 0.09);
            motion.scrollCurrent = lerp(motion.scrollCurrent, motion.scrollTarget, 0.06);

            const widthFactor = clamp(target.getBoundingClientRect().width / 520, 0.55, 1.25);
            const activity = clamp(
                (motion.pointerCurrent * config.pointerInfluence) +
                (motion.scrollCurrent * config.scrollInfluence),
                0,
                1
            );

            const targetSpeed = lerp(config.minSpeed, config.maxSpeed * widthFactor, activity);
            const targetNoise = lerp(config.idleNoise, config.activeNoise, activity);

            motion.speed = lerp(motion.speed, targetSpeed, 0.08);
            motion.noise = lerp(motion.noise, targetNoise, 0.08);
            phase += delta * motion.speed;
        };

        const draw = () => {
            const rect = target.getBoundingClientRect();
            const activity = clamp(motion.pointerCurrent + (motion.scrollCurrent * 0.3), 0, 1);
            const cell = clamp(config.cellSize - Math.round(activity * 2), 6, config.cellSize);
            const noise = motion.noise;
            const cols = Math.ceil(rect.width / cell);
            const rows = Math.ceil(rect.height / cell);
            const pointerPullX = (motion.pointerX - 0.5) * activity * 1.8;
            const pointerPullY = (motion.pointerY - 0.5) * activity * 1.8;

            ctx.fillStyle = settings.bg || '#fbfbf8';
            ctx.fillRect(0, 0, rect.width, rect.height);

            for (let y = 0; y < rows; y += 1) {
                for (let x = 0; x < cols; x += 1) {
                    const nx = x / Math.max(cols, 1);
                    const ny = y / Math.max(rows, 1);
                    const wave = Math.sin((nx * 7.8) + phase + pointerPullX) + Math.cos((ny * 9.4) - (phase * 0.74) + pointerPullY);
                    const sweep = Math.sin(((nx + ny) * 8.5) - (phase * 0.55) + ((motion.pointerX - motion.pointerY) * activity));
                    const threshold = (bayer[y % 4][x % 4] + 0.5) / 16;
                    const value = 0.5 + (wave * 0.18) + (sweep * 0.14) + ((threshold - 0.5) * noise);

                    if (value > threshold + 0.12) {
                        ctx.fillStyle = value > 0.78 ? (settings.accent || '#00a870') : (settings.ink || '#101312');
                        ctx.fillRect(x * cell, y * cell, Math.max(1, cell - 2), Math.max(1, cell - 2));
                    }
                }
            }
        };

        const tick = (time) => {
            updateMotion(time);
            draw();
            if (!prefersReducedMotion) frame = requestAnimationFrame(tick);
        };

        const observer = new ResizeObserver(() => {
            resize();
            draw();
        });

        observer.observe(target);
        resize();
        updateScrollTarget();
        tick(0);

        host.addEventListener('pointermove', (event) => {
            const rect = host.getBoundingClientRect();
            motion.pointerX = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
            motion.pointerY = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
            motion.pointerTarget = clamp(motion.pointerTarget + 0.18, 0, 1);
        }, { passive: true });

        host.addEventListener('pointerleave', () => {
            motion.pointerTarget = 0;
        });

        window.addEventListener('scroll', updateScrollTarget, { passive: true });

        window.addEventListener('pagehide', () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener('scroll', updateScrollTarget);
        }, { once: true });
    };

    initDitherCanvas(canvas);

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
