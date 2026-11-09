# Sky Switch Mini

A tiny, seamless 3-second looping day/night toggle built with Vite, React, TypeScript, and Framer Motion. Featuring full-viewport atmospheric sky gradient transitions (day, dusk, and night), an authentic SVG paper-grain texture overlay, 8 twinkling stars, floating clouds, 3 glowing drifting fireflies, and an interactive draggable knob that metamorphoses smoothly between a radiant sun with rotating rays and a cratered moon with soft lunar illumination.

## How to Run

```bash
cd sky-switch-mini
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

- **Interactive Drag:** Click or drag the knob across the track. Releasing spring-snaps to the nearest phase and resumes the 3.0s loop after 1.5s.
- **Keyboard Access:** Press <kbd>Space</kbd> or <kbd>Enter</kbd> to toggle.
- **Still & Screenshot Mode:** Add `?still=1` to inspect static day (`t=0`), `?still=1&t=0.5` for dusk, or `?still=1&t=1` for night.
- **Reduced Motion:** Honors `prefers-reduced-motion` with static state and instant toggle transitions.
