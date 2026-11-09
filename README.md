# Sky Switch Mini

A tiny, seamless 3-second looping day/night toggle crafted for high-fidelity screen recording. Built with Vite, React, TypeScript, Framer Motion, and plain CSS in a single stylesheet. Featuring full-viewport atmospheric sky transitions (day, dusk, and night), an authentic SVG paper-grain texture overlay, 8 twinkling stars, floating clouds, 3 glowing fireflies, and an interactive draggable knob that metamorphoses smoothly between a radiant sun with rotating rays and a cratered moon with soft lunar illumination.

<!-- GIF coming soon -->
*GIF coming soon*

---

## How It Works

The entire scene is orchestrated by a single Framer Motion `MotionValue` (`t`), which maps continuously from `0` (day) to `1` (night):
- **Full Viewport Sky:** Transitions from daylight warm peach & sky blue (`#ffe9c7` -> `#bfe6ff`) through twilight coral & violet (`#ff9d7a` / `#5a4a8a`) into deep midnight indigo (`#0b1030` -> `#2b1a66`).
- **Celestial Knob:** A 132px circle traveling 200px inside a 360px × 160px track. The knob face crossfades between `t = 0.4` and `0.6` from a radiant golden sun with 12 rotating rays to a silver-pearl cratered moon.
- **Atmospheric Track Elements:** 8 twinkling stars fade in when `t > 0.48`, 2 clouds softly dim from opacity `1.0` to `0.2`, and 3 glowing neon fireflies (cyan, magenta, and yellow) illuminate and drift when `t > 0.65`.
- **Zero React Re-Renders:** All animated properties modify GPU-accelerated transforms, opacities, and box-shadows directly, delivering a locked 60 FPS performance.
- **Seamless 3.0s Loop:** Ambient animations (sun rays 360° rotation, firefly drifting paths, and star twinkle cycles) use periods that divide 3 seconds (1.5s and 3.0s), guaranteeing zero phase pops or visible jumps at the loop boundary.

---

## How to Run

```bash
cd sky-switch-mini
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### URL Query Parameters

- **Clean Recording Mode (`?clean=1` or `?clean`):**
  [http://localhost:5173/?clean](http://localhost:5173/?clean)
  Hides the mouse cursor and suppresses focus outlines across the page for clean video capture and GIF recordings.
- **Still Screenshot Mode (`?still=1`):**
  - Day (`t = 0`): `http://localhost:5173/?still=1&t=0`
  - Early Dusk (`t = 0.25`): `http://localhost:5173/?still=1&t=0.25`
  - Sunset / Dusk (`t = 0.5`): `http://localhost:5173/?still=1&t=0.5`
  - Late Dusk (`t = 0.75`): `http://localhost:5173/?still=1&t=0.75`
  - Night (`t = 1`): `http://localhost:5173/?still=1&t=1`
- **Combining Parameters:**
  Clean recording at dusk: `http://localhost:5173/?clean&still=1&t=0.5`

---

## Interactions & Accessibility

- **Drag:** Press and drag the knob anywhere across the track. Releasing spring-snaps to the nearest phase (`t = 0` or `t = 1`) and resumes the automatic loop cycle after 1.5s.
- **Keyboard & Click:** Accessible `<button role="switch">` responds to <kbd>Space</kbd> or <kbd>Enter</kbd> to toggle between day and night with a prominent focus ring.
- **Reduced Motion:** Fully honors `prefers-reduced-motion` by disabling the continuous 3s loop in favor of a static state with an instant toggle transition.

---

## Credits

`tiny UI experiments · @krutivijay`
