let memoryTimeout = null;
let memoryAnim = null;
let memoryTime = 30;
let memoryLastTime = 0;
let memoryRunning = false;
const EMOJIS = ['🔥', '⚡', '💎', '🎯', '🚀', '🎮', '👾', '🌟'];

function launchMemory() {
    const W = Math.min(600, window.innerWidth - 40);
    const H = Math.min(400, window.innerHeight - 180);
    const ctx = setupCanvas(W, H);

    const container = document.getElementById('memory-container');
    const grid = document.getElementById('memory-grid');
    container.classList.add('active');
    document.getElementById('memory-status').textContent = 'Dobierz wszystkie pary!';

    const symbols = [...EMOJIS, ...EMOJIS];
    for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
    }

    grid.innerHTML = '';
    let flipped = [], matched = 0, busy = false;

    symbols.forEach((sym, i) => {
        const card = document.createElement('div');
        card.className = 'mem-card';
        card.innerHTML = `<div class="front">${sym}</div><div class="back"></div>`;
        card.onclick = () => {
            if (!memoryRunning || busy || card.classList.contains('matched') || card.classList.contains('flipped')) return;
            card.classList.add('flipped');
            card.style.borderColor = 'var(--cyan)';
            flipped.push({ card, sym });
            if (flipped.length === 2) {
                busy = true;
                if (flipped[0].sym === flipped[1].sym) {
                    flipped.forEach(f => { f.card.classList.add('matched'); f.card.style.borderColor = ''; });
                    flipped = []; busy = false; matched++;
                    setHUD(matched, 8, 'PARY', Math.ceil(memoryTime), 'CZAS');
                    if (matched === 8) {
                        memoryRunning = false;
                        cancelAnimationFrame(memoryAnim); memoryAnim = null;
                        document.getElementById('memory-status').textContent = '✓ Wszystkie pary dopasowane!';
                        memoryTimeout = setTimeout(() => {
                            container.classList.remove('active');
                            gameWon();
                        }, 700);
                    }
                } else {
                    memoryTimeout = setTimeout(() => {
                        flipped.forEach(f => { f.card.classList.remove('flipped'); f.card.style.borderColor = ''; });
                        flipped = []; busy = false;
                    }, 800);
                }
            }
        };
        grid.appendChild(card);
    });

    document.getElementById('hud-label').style.display = '';
    document.getElementById('hud-timer').style.display = '';
    memoryTime = 30;
    memoryLastTime = performance.now();
    memoryRunning = true;
    setHUD(0, 8, 'PARY', Math.ceil(memoryTime), 'CZAS');

    function memoryLoop(now) {
        if (!memoryRunning) return;
        const dt = Math.min((now - memoryLastTime) / 1000, 0.05);
        memoryLastTime = now;
        memoryTime -= dt;

        if (memoryTime <= 0) {
            memoryRunning = false;
            cancelAnimationFrame(memoryAnim); memoryAnim = null;
            showGameOver('Czas minął! Nie dopasowano wszystkich par.');
            return;
        }

        setHUD(matched, 8, 'PARY', Math.ceil(memoryTime), 'CZAS');

        ctx.clearRect(0, 0, W, H);
        const pct = memoryTime / 30;
        ctx.fillStyle = '#1a1a2a'; ctx.fillRect(0, H - 4, W, 4);
        const barColor = pct > 0.4 ? '#00f5ff' : pct > 0.2 ? '#ffaa00' : '#ff3355';
        ctx.fillStyle = barColor; ctx.fillRect(0, H - 4, W * pct, 4);

        memoryAnim = requestAnimationFrame(memoryLoop);
    }
    memoryAnim = requestAnimationFrame(memoryLoop);
}