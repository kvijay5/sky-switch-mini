# Sky Switch Mini

A tiny, seamless 3-second looping day/night toggle designed for screen recording. Built with Vite, React, TypeScript, Framer Motion, and plain CSS in a single stylesheet. Features full-viewport sky transitions across day, dusk, and night, an SVG paper-grain overlay, 8 twinkling stars, floating clouds, 3 glowing fireflies, and an interactive draggable knob that transitions between a sun with rotating rays and a cratered moon with lunar illumination.

<!-- GIF coming soon -->
*GIF coming soon*

---

## How It Works

Animation is driven by a single Framer Motion MotionValue (`t`), which avoids per-frame React re-renders:
- **Full Viewport Sky:** Transitions from daylight warm peach and sky blue (`#ffe9c7` -> `#bfe6ff`) through twilight coral and violet (`#ff9d7a` / `#5a4a8a`) into midnight indigo (`#0b1030` -> `#2b1a66`).
- **Knob:** A 132px circle traveling 200px inside a 360px × 160px track. The knob face crossfades between `t = 0.4` and `0.6` from a sun disc with 12 rotating rays to a cratered moon.
- **Track Elements:** 8 twinkling stars fade in when `t > 0.48`, 2 clouds dim from opacity `1.0` to `0.2`, and 3 glowing fireflies (cyan, magenta, and yellow) fade in when `t > 0.65` and drift inside the track.
- **Seamless 3.0s Loop:** Ambient animations (sun rays 360° rotation, firefly drifting paths, and star twinkle cycles) use periods that divide 3 seconds (1.5s and 3.0s) so states at `0.0s` and `3.0s` match.

---

## How to Run

```bash
cd sky-switch-mini
npm install
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser.

### URL Query Parameters

- **Clean Recording Mode (`?clean=1` or `?clean`):**
  [http://127.0.0.1:5173/?clean](http://127.0.0.1:5173/?clean)
  Hides the mouse cursor and suppresses focus outlines across the page for video capture and GIF recordings.
- **Still Screenshot Mode (`?still=1`):**
  - Day (`t = 0`): [http://127.0.0.1:5173/?still=1&t=0](http://127.0.0.1:5173/?still=1&t=0)
  - Early Dusk (`t = 0.25`): [http://127.0.0.1:5173/?still=1&t=0.25](http://127.0.0.1:5173/?still=1&t=0.25)
  - Sunset / Dusk (`t = 0.5`): [http://127.0.0.1:5173/?still=1&t=0.5](http://127.0.0.1:5173/?still=1&t=0.5)
  - Late Dusk (`t = 0.75`): [http://127.0.0.1:5173/?still=1&t=0.75](http://127.0.0.1:5173/?still=1&t=0.75)
  - Night (`t = 1`): [http://127.0.0.1:5173/?still=1&t=1](http://127.0.0.1:5173/?still=1&t=1)
- **Combining Parameters:**
  Clean recording at dusk: [http://127.0.0.1:5173/?clean&still=1&t=0.5](http://127.0.0.1:5173/?clean&still=1&t=0.5)

---

## Interactions & Accessibility

- **Drag:** Press and drag the knob across the track. Releasing spring-snaps to the nearest phase (`t = 0` or `t = 1`) and resumes the automatic loop cycle after 1.5s.
- **Keyboard & Click:** Accessible `<button role="switch">` responds to <kbd>Space</kbd> or <kbd>Enter</kbd> to toggle between day and night with a visible focus ring.
- **Reduced Motion:** When `prefers-reduced-motion` is enabled, the continuous 3s loop is stopped, starting at day (`t = 0`), while manual toggling remains supported.

---

## Credits

Built with Vite, React, TypeScript and Framer Motion.
Built with Antigravity (AI-assisted), then reviewed and tuned by me.
Made by kvijay5 · X: https://x.com/krutivijay
