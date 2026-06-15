let flappyAnim = null;
const PIPES_NEEDED = 10;
let flappyBird, flappyPipes, flappyPassed, flappyStarted;
let flappyLastTime = 0;
let flappySpeed = 180;
let flappyDistance = 0;

function launchFlappy() {
    const W = Math.min(500, window.innerWidth - 40);
    const H = Math.min(480, window.innerHeight - 180);
    const ctx = setupCanvas(W, H);
    document.getElementById('hud-label').style.display = '';
    document.getElementById('hud-timer').style.display = '';

    const GAP = 160, PIPE_W = 48;
    const GRAVITY = 980, JUMP = -360;

    flappyBird = { x: W * 0.25, y: H / 2, vy: 0, r: 16 };
    flappyPipes = [];
    flappyPassed = 0;
    flappyStarted = false;
    flappySpeed = 180;
    flappyDistance = 0;

    setHUD(0, PIPES_NEEDED, 'BRAMY', 0, '');
    document.getElementById('hud-label').textContent = 'BRAMY';

    function spawnPipe() {
        const gapY = 80 + Math.random() * (H - GAP - 160);
        flappyPipes.push({ x: W + PIPE_W, topH: gapY, botY: gapY + GAP, passed: false });
    }

    function jump() {
        if (!flappyStarted) { flappyStarted = true; }
        flappyBird.vy = JUMP;
    }

    const canvas = getCanvas();
    canvas.onclick = jump;
    const onKey = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); } };
    document.addEventListener('keydown', onKey);

    function cleanup() {
        canvas.onclick = null;
        document.removeEventListener('keydown', onKey);
    }

    let particles = [];
    function addParticles(x, y) {
        for (let i = 0; i < 12; i++) particles.push({
            x, y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
            life: 1, color: ['#ffaa00', '#00f5ff', '#ff00aa'][Math.floor(Math.random() * 3)]
        });
    }

    let bgStars = Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() + 0.5 }));

    function loop(now) {
        const dt = Math.min((now - flappyLastTime) / 1000, 0.05);
        flappyLastTime = now;

        if (!flappyStarted) {
            ctx.fillStyle = '#08080f'; ctx.fillRect(0, 0, W, H);
            bgStars.forEach(s => { ctx.fillStyle = 'rgba(200,210,240,0.5)'; ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill(); });
            drawBird(ctx, flappyBird);
            ctx.fillStyle = 'rgba(0,245,255,0.8)';
            ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center';
            ctx.fillText('NACIŚNIJ SPACJĘ lub LPM aby skoczyć', W / 2, H * 0.4);
            ctx.font = '12px Courier New';
            ctx.fillStyle = 'var(--dim)';
            ctx.fillText(`Przeleć przez ${PIPES_NEEDED} bram`, W / 2, H * 0.4 + 28);
            ctx.textAlign = 'left';
            flappyLastTime = now;
            flappyAnim = requestAnimationFrame(loop); return;
        }

        flappyBird.vy += GRAVITY * dt;
        flappyBird.y += flappyBird.vy * dt;

        flappyDistance += flappySpeed * dt;
        if (flappyDistance > 396) {
            flappyDistance = 0;
            spawnPipe();
        }

        flappyPipes = flappyPipes.filter(p => p.x > -PIPE_W - 10);
        flappyPipes.forEach(p => p.x -= flappySpeed * dt);

        let levelWon = false;
        for (let p of flappyPipes) {
            if (!p.passed && p.x + PIPE_W < flappyBird.x - flappyBird.r) {
                p.passed = true;
                flappyPassed++;
                flappySpeed *= 1.05;
                playCoin();
                addParticles(flappyBird.x, flappyBird.y);
                setHUD(flappyPassed, PIPES_NEEDED, 'BRAMY');
                if (flappyPassed >= PIPES_NEEDED) {
                    levelWon = true;
                    break;
                }
            }
        }

        if (levelWon) {
            cancelAnimationFrame(flappyAnim); flappyAnim = null;
            cleanup();
            gameWon();
            return;
        }

        if (flappyBird.y + flappyBird.r > H || flappyBird.y - flappyBird.r < 0) {
            cancelAnimationFrame(flappyAnim); flappyAnim = null;
            cleanup();
            showGameOver('serio...? Uważaj na sufity i podłogi.');
            return;
        }

        for (const p of flappyPipes) {
            const bx = flappyBird.x, by = flappyBird.y, br = flappyBird.r * 0.85;
            if (bx + br > p.x && bx - br < p.x + PIPE_W) {
                if (by - br < p.topH || by + br > p.botY) {
                    cancelAnimationFrame(flappyAnim); flappyAnim = null;
                    cleanup();
                    showGameOver('Uderzono w rurę! Spróbuj ponownie.');
                    return;
                }
            }
        }

        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 2; });

        ctx.fillStyle = '#08080f'; ctx.fillRect(0, 0, W, H);
        bgStars.forEach(s => { ctx.fillStyle = 'rgba(200,210,240,0.4)'; ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill(); });

        flappyPipes.forEach(p => {
            const isClose = Math.abs(flappyBird.x - (p.x + PIPE_W / 2)) < 100;
            ctx.fillStyle = isClose ? 'rgba(255,170,0,0.15)' : 'rgba(0,245,255,0.08)';
            ctx.fillRect(p.x, 0, PIPE_W, p.topH);
            ctx.fillRect(p.x, p.botY, PIPE_W, H - p.botY);
            ctx.strokeStyle = isClose ? '#ffaa00' : '#00f5ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, 0, PIPE_W, p.topH);
            ctx.strokeRect(p.x, p.botY, PIPE_W, H - p.botY);

            ctx.fillStyle = isClose ? '#ffaa00' : '#00f5ff';
            ctx.fillRect(p.x - 4, p.topH - 10, PIPE_W + 8, 10);
            ctx.fillRect(p.x - 4, p.botY, PIPE_W + 8, 10);
        });

        particles.forEach(p => {
            ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            const radius = Math.max(0.1, 4 * p.life);
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        drawBird(ctx, flappyBird);

        for (let i = 0; i < PIPES_NEEDED; i++) {
            ctx.fillStyle = i < flappyPassed ? '#00ff88' : '#1a1a2a';
            ctx.strokeStyle = i < flappyPassed ? '#00ff88' : '#4a5068';
            ctx.lineWidth = 1;
            const dotSpacing = Math.min(22, (W - 40) / PIPES_NEEDED);
            ctx.beginPath(); ctx.arc(W / 2 + (i - (PIPES_NEEDED - 1) / 2) * dotSpacing, 16, 7, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
        }

        flappyAnim = requestAnimationFrame(loop);
    }
    flappyLastTime = performance.now();
    flappyAnim = requestAnimationFrame(loop);
}

function drawBird(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);

    const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (b.vy * 0.1) * (Math.PI / 180)));
    ctx.rotate(angle);

    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.r * 2.5);
    g.addColorStop(0, 'rgba(255,170,0,0.4)'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.r * 2.5, 0, Math.PI * 2); ctx.fill();

    if (playerImg.complete && playerImg.naturalWidth > 0) {
        const imgW = b.r * 2.8;
        const imgH = b.r * 2.8;
        ctx.drawImage(playerImg, -imgW / 2, -imgH / 2, imgW, imgH);
    } else {
        ctx.fillStyle = 'rgba(255,170,0,0.9)';
        ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(b.r * 0.4, -b.r * 0.2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.r * 0.4 + 1, -b.r * 0.2 - 1, 1.5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(255,200,0,0.7)';
        ctx.beginPath(); ctx.ellipse(-b.r * 0.3, b.r * 0.2, b.r * 0.6, b.r * 0.35, -0.3, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
}