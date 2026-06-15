window.addEventListener('load', () => {
    const terminal = document.getElementById('boot-terminal');
    const lines = [
        "[OK] Wczytywanie protokołu urodzinowego...",
        "[OK] Omijanie firewalla...",
        "[OK] Inicjalizacja rdzenia...",
        "> SYSTEM ONLINE."
    ];

    let delay = 0;
    lines.forEach((line) => {
        setTimeout(() => {
            const p = document.createElement('div');
            p.textContent = line;
            p.style.marginBottom = '12px';
            terminal.appendChild(p);
        }, delay);
        delay += 500 + Math.random() * 300;
    });

    setTimeout(() => {
        showScreen('screen-welcome');
    }, 3000);
});

const playerImg = new Image();
playerImg.src = 'eryk.png';

const ENCODED_CODE = "R0lGVC1DT0RFLVNURUFNMQ==";

function getDecodedChar(idx) {
    return atob(ENCODED_CODE).replace(/-/g, '')[idx];
}

const REVEAL_MAP = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12, 13, 14]
];
const GAME_NAMES = ['CLICKER', 'DODGER', 'MEMORY', 'FLAPPY'];

let currentGame = 0;
let revealedCount = 0;

function triggerShake() {
    document.body.classList.remove('shaking');
    void document.body.offsetWidth;
    document.body.classList.add('shaking');
    setTimeout(() => document.body.classList.remove('shaking'), 400);
}

function buildProgressBar() {
    const disp = document.getElementById('code-display');
    disp.innerHTML = '';
    for (let i = 0; i < 15; i++) {
        if (i === 5 || i === 10) {
            const dash = document.createElement('div');
            dash.className = 'code-char dash'; dash.textContent = '-';
            disp.appendChild(dash);
        }
        const el = document.createElement('div');
        el.className = 'code-char';
        el.id = `cc-${i}`;
        el.setAttribute('data-char', getDecodedChar(i));
        el.textContent = '_';
        disp.appendChild(el);
    }
}

function revealChars(indices, callback) {
    let i = 0;
    function next() {
        if (i >= indices.length) { if (callback) callback(); return; }
        const idx = indices[i++];
        const el = document.getElementById(`cc-${idx}`);
        if (!el) { next(); return; }
        el.classList.add('animating');
        el.textContent = '';
        setTimeout(() => {
            el.classList.remove('animating');
            el.classList.add('revealed');
            el.textContent = getDecodedChar(idx);
            setTimeout(next, 120);
        }, 700);
    }
    setTimeout(next, 200);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const s = document.getElementById(id);
    if (s) s.classList.add('active');
}

function startGame() {
    initAudio();
    bgMusic.play().catch(e => console.warn('Audio play failed:', e));
    buildProgressBar();
    document.getElementById('progress-bar').classList.add('visible');
    currentGame = 0;
    launchGame(0);
}

function launchGame(idx) {
    showScreen('');
    document.getElementById('game-header').style.display = 'flex';
    const badge = document.getElementById('header-badge');
    const colors = ['var(--cyan)', 'var(--magenta)', 'var(--green)', 'var(--amber)'];
    badge.textContent = `GAME ${idx + 1} // ${GAME_NAMES[idx]}`;
    badge.style.borderColor = badge.style.color = colors[idx];

    if (idx === 0) launchClicker();
    else if (idx === 1) launchDodger();
    else if (idx === 2) launchMemory();
    else if (idx === 3) launchFlappy();
}

function gameWon() {
    const indices = REVEAL_MAP[currentGame];
    revealChars(indices, () => {
        setTimeout(() => showTransition(), 300);
    });
}

function showTransition() {
    stopAllGames();
    document.getElementById('game-header').style.display = 'none';
    document.getElementById('game-canvas').classList.remove('active');
    document.getElementById('memory-container').classList.remove('active');

    const indices = REVEAL_MAP[currentGame];
    const container = document.getElementById('trans-chars');
    container.innerHTML = '';
    indices.forEach(i => {
        const d = document.createElement('div');
        d.className = 'rev-char';
        d.textContent = getDecodedChar(i);
        container.appendChild(d);
    });

    const nextIdx = currentGame + 1;
    if (nextIdx < GAME_NAMES.length) {
        document.getElementById('trans-next-label').textContent = 'Następna gra:';
        document.getElementById('trans-next-name').textContent = `${nextIdx + 1}. ${GAME_NAMES[nextIdx]}`;
        document.getElementById('trans-btn').textContent = 'DALEJ →';
    } else {
        document.getElementById('trans-next-label').textContent = '';
        document.getElementById('trans-next-name').textContent = '';
        document.getElementById('trans-btn').textContent = '🎉 ODBIERZ KOD';
    }
    showScreen('screen-transition');
}

function nextGame() {
    currentGame++;
    if (currentGame >= GAME_NAMES.length) {
        showWin();
    } else {
        launchGame(currentGame);
    }
}

function showGameOver(msg) {
    stopAllGames();
    playExplosion();
    triggerShake();
    document.getElementById('game-header').style.display = 'none';
    document.getElementById('game-canvas').classList.remove('active');
    document.getElementById('memory-container').classList.remove('active');
    document.getElementById('gameover-sub').textContent = msg || 'Spróbuj jeszcze raz';
    showScreen('screen-gameover');
}

function retryGame() {
    launchGame(currentGame);
}

function showWin() {
    showScreen('screen-win');
    document.getElementById('win-code-display').textContent = atob(ENCODED_CODE);
    startConfetti();
}

function stopAllGames() {
    if (clickerAnim) { cancelAnimationFrame(clickerAnim); clickerAnim = null; }
    if (dodgerAnim) { cancelAnimationFrame(dodgerAnim); dodgerAnim = null; }
    if (flappyAnim) { cancelAnimationFrame(flappyAnim); flappyAnim = null; }
    if (memoryAnim) { cancelAnimationFrame(memoryAnim); memoryAnim = null; }
    memoryRunning = false;
    if (memoryTimeout) clearTimeout(memoryTimeout); memoryTimeout = null;
}

function setupCanvas(w, h) {
    const canvas = document.getElementById('game-canvas');
    canvas.width = w; canvas.height = h;
    canvas.classList.add('active');
    return canvas.getContext('2d');
}

function getCanvas() { return document.getElementById('game-canvas'); }

function setHUD(score, total, scoreLabel, time, timeLabel) {
    if (scoreLabel !== undefined) {
        document.getElementById('hud-score').textContent = total ? `${score}/${total}` : score;
    }
    if (time !== undefined) {
        document.getElementById('hud-timer').textContent = time || '';
        if (timeLabel !== undefined) {
            const l = document.getElementById('hud-label');
            l.style.display = timeLabel ? '' : 'none';
            document.getElementById('hud-timer').style.display = timeLabel ? '' : 'none';
            l.textContent = timeLabel;
        }
    }
}

let confettiAnim = null;
function startConfetti() {
    const canvas = document.getElementById('win-canvas');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const pieces = [];
    const colors = ['#00f5ff', '#ff00aa', '#ffaa00', '#00ff88', '#ffffff', '#4466ff'];
    for (let i = 0; i < 120; i++) pieces.push({
        x: Math.random() * canvas.width, y: -20 - Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 200, vy: 120 + Math.random() * 200,
        r: 4 + Math.random() * 6, rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 8, color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() < 0.5 ? 'rect' : 'circle', w: 8 + Math.random() * 8, h: 4 + Math.random() * 6
    });
    let last = performance.now();
    function loop(now) {
        const dt = (now - last) / 1000; last = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.rotV * dt;
            if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.color; ctx.globalAlpha = 0.85;
            if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
            else { ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
            ctx.restore();
        });
        confettiAnim = requestAnimationFrame(loop);
    }
    confettiAnim = requestAnimationFrame(loop);
}

function copyCode() {
    navigator.clipboard.writeText(atob(ENCODED_CODE)).then(() => {
        const fb = document.getElementById('copy-feedback');
        fb.textContent = '✓ SKOPIOWANO DO SCHOWKA!';
        setTimeout(() => fb.textContent = '', 3000);
    }).catch(() => {
        const el = document.createElement('textarea');
        el.value = atob(ENCODED_CODE); document.body.appendChild(el);
        el.select(); document.execCommand('copy');
        document.body.removeChild(el);
        const fb = document.getElementById('copy-feedback');
        fb.textContent = '✓ SKOPIOWANO!';
        setTimeout(() => fb.textContent = '', 3000);
    });
}

buildProgressBar();