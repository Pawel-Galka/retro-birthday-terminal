let dodgerAnim = null;
let dodgerTime = 18;
let dodgerLastTime = 0;
let dodger = { x: 0, y: 0, vx: 0, vy: 0, size: 18 };
let dodgerObstacles = [];
let dodgerKeys = {};
let dodgerSpawnTimer = 0;
let dodgerMouseX = null, dodgerMouseY = null;

function launchDodger() {
    const W = Math.min(600, window.innerWidth - 40);
    const H = Math.min(440, window.innerHeight - 180);
    const ctx = setupCanvas(W, H);

    dodgerTime = 18; dodgerLastTime = performance.now();
    dodgerObstacles = []; dodgerSpawnTimer = 0;
    dodger = { x: W / 2, y: H - 50, vx: 0, vy: 0, size: 18 };
    dodgerMouseX = null; dodgerMouseY = null;

    setHUD(0, 0, '', Math.ceil(dodgerTime), 'CZAS');

    const canvas = getCanvas();

    const onKey = (e) => { dodgerKeys[e.key] = e.type === 'keydown'; };
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKey);

    const onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        dodgerMouseX = e.clientX - rect.left;
        dodgerMouseY = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', onMove);

    const onTouch = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        dodgerMouseX = e.touches[0].clientX - rect.left;
        dodgerMouseY = e.touches[0].clientY - rect.top;
    };
    canvas.addEventListener('touchmove', onTouch, { passive: false });

    function cleanup() {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('keyup', onKey);
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('touchmove', onTouch);
    }

    let stars = Array.from({ length: 40 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        s: Math.random() * 1.5 + 0.5, b: Math.random()
    }));

    function loop(now) {
        const dt = Math.min((now - dodgerLastTime) / 1000, 0.05);
        dodgerLastTime = now;
        dodgerTime -= dt;

        if (dodgerTime <= 0) {
            cancelAnimationFrame(dodgerAnim); dodgerAnim = null;
            cleanup();
            gameWon(); return;
        }
        setHUD(0, 0, '', Math.ceil(dodgerTime), 'CZAS');

        const SPEED = 220;

        let moveX = 0, moveY = 0;
        if (dodgerKeys['ArrowLeft'] || dodgerKeys['a'] || dodgerKeys['A']) moveX = -1;
        if (dodgerKeys['ArrowRight'] || dodgerKeys['d'] || dodgerKeys['D']) moveX = 1;
        if (dodgerKeys['ArrowUp'] || dodgerKeys['w'] || dodgerKeys['W']) moveY = -1;
        if (dodgerKeys['ArrowDown'] || dodgerKeys['s'] || dodgerKeys['S']) moveY = 1;

        if (moveX || moveY) {
            const mag = Math.sqrt(moveX * moveX + moveY * moveY);
            dodger.x += (moveX / mag) * SPEED * dt;
            dodger.y += (moveY / mag) * SPEED * dt;
        } else if (dodgerMouseX !== null) {
            const dx = dodgerMouseX - dodger.x, dy = dodgerMouseY - dodger.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > 5) { dodger.x += (dx / d) * SPEED * dt; dodger.y += (dy / d) * SPEED * dt; }
        }

        dodger.x = Math.max(dodger.size, Math.min(W - dodger.size, dodger.x));
        dodger.y = Math.max(dodger.size, Math.min(H - dodger.size, dodger.y));

        dodgerSpawnTimer += dt;
        const spawnRate = 0.55 - (18 - dodgerTime) * 0.018;
        if (dodgerSpawnTimer > spawnRate) {
            dodgerSpawnTimer = 0;
            const type = Math.random();
            if (type < 0.5) {
                dodgerObstacles.push({
                    x: Math.random() * (W - 30) + 15, y: -20,
                    w: 20 + Math.random() * 20, h: 20 + Math.random() * 20,
                    vx: (Math.random() - 0.5) * 80, vy: 180 + Math.random() * 120,
                    type: 'rock', rot: 0, rotV: (Math.random() - 0.5) * 3
                });
            } else if (type < 0.8) {
                const fromLeft = Math.random() < 0.5;
                dodgerObstacles.push({
                    x: fromLeft ? -30 : W + 30, y: Math.random() * (H - 80) + 40,
                    w: 36, h: 12,
                    vx: fromLeft ? 300 : -300, vy: 0,
                    type: 'missile', rot: fromLeft ? 0 : Math.PI
                });
            } else {
                const lx = Math.random() * (W - 20) + 10;
                dodgerObstacles.push({ x: lx, y: -10, w: 12, h: H + 20, vx: 0, vy: 0, type: 'laser', life: 2.0, age: 0, fired: false });
            }
        }

        dodgerObstacles = dodgerObstacles.filter(o => {
            o.x += o.vx * dt; o.y += o.vy * dt;
            if (o.rot !== undefined && o.rotV) o.rot += o.rotV * dt;
            if (o.age !== undefined) o.age += dt;
            if (o.type === 'laser') {
                if (o.age >= 1.5) o.fired = true;
                return o.age < o.life;
            }
            if (o.type === 'rock') return o.y < H + 40;
            if (o.type === 'missile') return o.x > -50 && o.x < W + 50;
            return true;
        });

        const s = dodger.size;
        for (const o of dodgerObstacles) {
            if (o.type === 'laser') {
                if (o.fired && dodger.x + s * 0.7 > o.x - o.w / 2 && dodger.x - s * 0.7 < o.x + o.w / 2) {
                    cancelAnimationFrame(dodgerAnim); dodgerAnim = null;
                    cleanup();
                    showGameOver('Zestrzelony! Spróbuj się poruszać szybciej.');
                    return;
                }
                continue;
            }
            const hw = o.w / 2, hh = o.h / 2;
            if (dodger.x + s * 0.75 > o.x - hw && dodger.x - s * 0.75 < o.x + hw &&
                dodger.y + s * 0.75 > o.y - hh && dodger.y - s * 0.75 < o.y + hh) {
                cancelAnimationFrame(dodgerAnim); dodgerAnim = null;
                cleanup();
                showGameOver('Kolizja! Spróbuj ponownie.');
                return;
            }
        }

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#08080f'; ctx.fillRect(0, 0, W, H);

        stars.forEach(st => {
            st.b = (st.b + 0.01) % 1;
            const alpha = 0.3 + Math.sin(st.b * Math.PI * 2) * 0.3;
            ctx.fillStyle = `rgba(200,210,240,${alpha})`;
            ctx.beginPath(); ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2); ctx.fill();
        });

        dodgerObstacles.forEach(o => {
            ctx.save(); ctx.translate(o.x, o.y);
            if (o.rot) ctx.rotate(o.rot);

            if (o.type === 'rock') {
                ctx.strokeStyle = '#ff3355'; ctx.lineWidth = 2;
                ctx.fillStyle = 'rgba(255,51,85,0.15)';
                ctx.beginPath();
                const pts = 6, r1 = o.w / 2, r2 = o.h / 2;
                for (let i = 0; i < pts; i++) {
                    const a = (i / pts) * Math.PI * 2;
                    const rr = (i % 2 === 0 ? r1 : r2) * 0.8;
                    i === 0 ? ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
                        : ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();
            } else if (o.type === 'missile') {
                ctx.fillStyle = '#ff3355';
                ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.moveTo(o.w / 2, 0); ctx.lineTo(o.w / 2 + 10, -5); ctx.lineTo(o.w / 2 + 10, 5); ctx.fill();
                ctx.fillStyle = 'rgba(255,170,0,0.4)';
                ctx.beginPath(); ctx.ellipse(-o.w / 2 - 8, 0, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
            } else if (o.type === 'laser') {
                if (!o.fired) {
                    const flash = Math.sin(o.age * 20) * 0.5 + 0.5;
                    ctx.fillStyle = `rgba(255, 51, 85, ${flash * 0.3})`;
                    ctx.fillRect(-o.w / 2, -H, o.w, H * 3);
                    ctx.strokeStyle = `rgba(255, 51, 85, ${flash})`;
                    ctx.beginPath();
                    ctx.setLineDash([10, 10]);
                    ctx.moveTo(0, -H); ctx.lineTo(0, H * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    const alpha = 1 - (o.age - 1.5) / 0.5;
                    ctx.fillStyle = `rgba(0,245,255,${Math.max(0, alpha) * 0.8})`;
                    ctx.fillRect(-o.w / 2, -H, o.w, H * 3);
                    ctx.strokeStyle = `rgba(0,245,255,${Math.max(0, alpha)})`;
                    ctx.lineWidth = 3; ctx.beginPath();
                    ctx.moveTo(0, -H); ctx.lineTo(0, H * 2); ctx.stroke();
                }
            }
            ctx.restore();
        });

        const px = dodger.x, py = dodger.y;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, s * 2);
        grad.addColorStop(0, 'rgba(0,245,255,0.3)'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(px, py, s * 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py - s); ctx.lineTo(px + s * 0.7, py + s * 0.7);
        ctx.lineTo(px, py + s * 0.3); ctx.lineTo(px-s * 0.7, py + s * 0.7);
        ctx.closePath(); ctx.stroke();
        ctx.fillStyle = 'rgba(0,245,255,0.2)'; ctx.fill();

        const pct = dodgerTime / 18;
        ctx.fillStyle = '#1a1a2a'; ctx.fillRect(0, H - 4, W, 4);
        const bc = pct > 0.4 ? '#00f5ff' : pct > 0.2 ? '#ffaa00' : '#ff3355';
        ctx.fillStyle = bc; ctx.fillRect(0, H - 4, W * pct, 4);

        if (dodgerTime < 5) {
            ctx.fillStyle = `rgba(0,245,255,${0.4 + Math.sin(now / 150) * 0.3})`;
            ctx.font = `bold ${24 + Math.sin(now / 100) * 4}px Courier New`;
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(dodgerTime)}s`, W / 2, H / 2);
            ctx.textAlign = 'left';
        }

        dodgerAnim = requestAnimationFrame(loop);
    }
    dodgerAnim = requestAnimationFrame(loop);
}