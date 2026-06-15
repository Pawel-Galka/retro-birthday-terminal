# 🕹️ Retro-Gaming Birthday Activation Terminal

An interactive, modular HTML5 web application designed as a gamified reward system. The application features a 4-stage mini-game suite that dynamically unlocks segments of an encrypted product activation key upon successful level completion.

🚀 **[LIVE DEMO - Click here to play](https://pawel-galka.github.io/retro-birthday-terminal/)**

## 🛠️ Tech Stack & Architecture
- **Frontend:** Semantic HTML5, Custom Cyberpunk/Retro CSS Variables, Keyframe Animations.
- **Graphics Engine:** HTML5 Canvas API (2D Context) for fluid, physics-based obstacle rendering and granular particle systems.
- **Audio Engine:** Native Web Audio API for procedural real-time sound effect synthesis (Square, Sine, and Sawtooth wave oscillators), completely bypassing external asset dependencies.
- **State Management:** Modular Architecture split into independent game loops managed via a centralized control system (`game.js`) utilizing `requestAnimationFrame` for performance optimization.

## 🧠 Key Features Implemented
1. **Procedural Audio Generation:** Leverages the Web Audio API to synthesize retro 8-bit sounds (click sound, coin pickup, explosion rumbles) programmatically.
2. **Deterministic Mechanics & Collision Detection:** Built custom collision boxes (AABB and Circle-to-Rectangle) for real-time physics calculations in Game 2 (Dodger) and Game 4 (Flappy Bird).
3. **Data Obfuscation (Security):** Encrypted the sensitive delivery payload (Steam Activation Key) utilizing a Base64 algorithm, decoding it via runtime memory allocation (`atob()`) only when the final victory criteria are met.
4. **Dynamic Scaling & UX Juice:** Features adaptive gameplay scaling (progressive velocity increments inside the Flappy Bird engine) and immediate tactile screen-shaking feedback during fail-states.

## 📁 Project Structure
- `index.html` - Application entry point & screen state layout.
- `css/style.css` - UI aesthetics, responsive scaling, CRT scanline overlay, animations.
- `js/audio.js` - Audio context initialization and oscillator synthesizer formulas.
- `js/game.js` - Global state handling, Base64 security layer, screen router.
- `js/games/` - Independent logic scripts encapsulating each game loop.
