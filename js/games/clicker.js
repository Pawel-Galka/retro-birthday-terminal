let clickerAnim = null;
let clickerTargets = [];
let clickerScore = 0;
let clickerTotal = 10;
let clickerTime = 22.5;
let clickerLastTime = 0;

function launchClicker() {
    const W = Math.min(600, window.innerWidth - 40);
    const H = Math.min(400, window.innerHeight - 180);
    const ctx = setupCanvas(W, H);

    clickerTime = 22.5;
    setHUD(0, clickerTotal, 'CELE', Math.ceil(clickerTime), 'CZAS');
    clickerScore = 0;
    clickerTargets = [];
    clickerLastTime = performance.now();

    for (let i = 0; i < 3; i++) spawnClickerTarget(W, H);

    const canvas = getCanvas();
    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        let hit = false;

        for (let i = clickerTargets.length - 1; i >= 0; i--) {
            const t = clickerTargets[i];
            const dx = mx - t.x, dy = my - t.y;
            if (dx * dx + dy * dy <= t.r * t.r) {
                clickerTargets.splice(i, 1);
                clickerScore++;
                hit = true;
                playBeep();
                setHUD(clickerScore, clickerTotal, 'CELE');
                spawnClickerTarget(W, H);
                if (clickerScore >= clickerTotal) {
                    cancelAnimationFrame(clickerAnim); clickerAnim = null;
                    canvas.onclick = null;
                    gameWon(); return;
                }
                break;
            }
        }

        if (!hit) {
            clickerTime -= 1.0;
        }
    };

    function loop(now) {
        const dt = (now - clickerLastTime) / 1000;
        clickerLastTime = now;
        clickerTime -= dt;
        if (clickerTime <= 0) {
            cancelAnimationFrame(clickerAnim); clickerAnim = null;
            canvas.onclick = null;
            showGameOver(`Czas minął! Kliknięto ${clickerScore}/${clickerTotal} celów.`);
            return;
        }
        setHUD(clickerScore, clickerTotal, 'CELE', Math.ceil(clickerTime), 'CZAS');

        clickerTargets.forEach(t => {
            t.x += t.vx; t.y += t.vy;
            if (t.x - t.r < 0 || t.x + t.r > W) t.vx *= -1;
            if (t.y - t.r < 0 || t.y + t.r > H) t.vy *= -1;
            t.phase += 0.05;
        });

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#10101a';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        clickerTargets.forEach(t => {
            const pulse = Math.sin(t.phase) * 0.3 + 0.7;
            const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r * 1.8);
            grad.addColorStop(0, `rgba(255,0,170,${0.2 * pulse})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 1.8, 0, Math.PI * 2); ctx.fill();

            ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,0,170,${pulse})`; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = `rgba(255,0,170,${0.15 * pulse})`; ctx.fill();

            ctx.strokeStyle = `rgba(255,0,170,${pulse})`; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(t.x - t.r * 0.6, t.y); ctx.lineTo(t.x + t.r * 0.6, t.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(t.x, t.y - t.r * 0.6); ctx.lineTo(t.x, t.y + t.r * 0.6); ctx.stroke();
        });

        const pct = clickerTime / 22.5;
        ctx.fillStyle = '#1a1a2a'; ctx.fillRect(0, H - 4, W, 4);
        const barColor = pct > 0.4 ? '#00f5ff' : pct > 0.2 ? '#ffaa00' : '#ff3355';
        ctx.fillStyle = barColor; ctx.fillRect(0, H - 4, W * pct, 4);

        clickerAnim = requestAnimationFrame(loop);
    }
    clickerAnim = requestAnimationFrame(loop);
}

function spawnClickerTarget(W, H) {
    const r = 30 + Math.random() * 15;
    const speed = 1.0 + Math.random() * 1.5;
    const angle = Math.random() * Math.PI * 2;
    clickerTargets.push({
        x: r + Math.random() * (W - r * 2),
        y: r + Math.random() * (H - r * 2),
        r, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        phase: Math.random() * Math.PI * 2
    });
}