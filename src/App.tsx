import { useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, type AnimationPlaybackControls } from "framer-motion";
import { HANDLE, SHOW_HANDLE } from "./config";

// Physical, weighty cubic bezier curve for the knob transition
const WEIGHTY_EASE = [0.45, 0.05, 0.15, 0.98] as const;

export default function App() {
  // Single MotionValue driving the entire scene (0 = Day, 1 = Night)
  const t = useMotionValue(0);
  const activeAnimation = useRef<AnimationPlaybackControls | null>(null);
  const resumeTimeout = useRef<number | null>(null);
  const isDragging = useRef(false);
  const hasMovedDuringDrag = useRef(false);
  const dragStartX = useRef(0);
  const dragStartT = useRef(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Read URL parameters and preferences once
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const hasStill = searchParams.get("still") === "1" || searchParams.has("still");
  const isClean = searchParams.get("clean") === "1" || searchParams.has("clean");
  const tParam = searchParams.get("t");
  const isReducedMotion = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  // Determine initial t
  let initialT = 0;
  if (tParam !== null) {
    const parsed = parseFloat(tParam);
    if (!isNaN(parsed)) {
      initialT = Math.max(0, Math.min(1, parsed));
    }
  }

  // --- DERIVED MOTION VALUES (Zero React re-render per frame) ---

  // 1. Full Viewport Background crossfade (Day -> Dusk -> Night)
  const bgDayOpacity = useTransform(t, [0, 0.5, 1], [1, 0, 0]);
  const bgDuskOpacity = useTransform(t, [0, 0.5, 1], [0, 1, 0]);
  const bgNightOpacity = useTransform(t, [0, 0.5, 1], [0, 0, 1]);

  // 2. Switch Track border and inner sky layers
  const trackBorderColor = useTransform(
    t,
    [0, 0.5, 1],
    ["rgba(255, 255, 255, 0.7)", "rgba(255, 195, 175, 0.55)", "rgba(150, 170, 240, 0.4)"]
  );

  // 3. Stars inside the track (fade in when t passes 0.48)
  const starsOpacity = useTransform(t, [0.48, 0.65, 1], [0, 0.85, 1]);

  // 4. Clouds inside track (opacity 1 -> 0.2, subtle horizontal drift)
  const cloudsOpacity = useTransform(t, [0, 0.55, 1], [1, 0.5, 0.2]);
  const cloud1X = useTransform(t, [0, 1], [0, -18]);
  const cloud2X = useTransform(t, [0, 1], [0, 16]);

  // 5. Fireflies inside track (fade in for t > 0.65, 30% brighter)
  const firefliesOpacity = useTransform(t, [0.65, 0.82, 1], [0, 0.95, 1]);

  // 6. Knob horizontal translation (0px to 200px)
  const knobX = useTransform(t, [0, 1], [0, 200]);

  // 7. Knob Glow & Shadow (dynamic soft box-shadow avoiding harsh rings or clipping)
  const knobBoxShadow = useTransform(
    t,
    [0, 0.5, 1],
    [
      "0 0 25px rgba(251, 191, 36, 0.55), 0 0 50px rgba(245, 158, 11, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.85), inset 0 -3px 6px rgba(217, 119, 6, 0.35)",
      "0 0 25px rgba(255, 120, 80, 0.55), 0 0 50px rgba(244, 63, 94, 0.25), inset 0 2px 4px rgba(255, 220, 210, 0.85), inset 0 -3px 6px rgba(180, 50, 50, 0.35)",
      "0 0 25px rgba(191, 219, 254, 0.55), 0 0 50px rgba(147, 197, 253, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(51, 65, 85, 0.4)"
    ]
  );

  // 8. Knob Sun & Moon face crossfade (between t=0.4 and 0.6)
  const sunOpacity = useTransform(t, [0.4, 0.54], [1, 0]);
  const moonOpacity = useTransform(t, [0.46, 0.6], [0, 1]);
  const sunScale = useTransform(t, [0.4, 0.55], [1, 0.92]);
  const moonScale = useTransform(t, [0.45, 0.6], [0.92, 1]);

  // Warm dusk sunset glow overlay to eliminate muddy transition (coral/rose twilight)
  const duskKnobOpacity = useTransform(t, [0.38, 0.5, 0.62], [0, 0.65, 0]);

  // 9. Caption color & opacity for crystal-clear legibility across day/dusk/night
  const captionColor = useTransform(t, [0, 0.5, 1], ["#0f172a", "#ffffff", "#f1f5f9"]);
  const captionOpacity = useTransform(t, [0, 0.5, 1], [0.72, 0.9, 0.8]);

  // --- LOOP ANIMATION ENGINE ---
  const startLoop = useCallback(() => {
    activeAnimation.current?.stop();
    // 3.0s total:
    // 0.0-0.5s: hold day (0 -> 0)
    // 0.5-1.4s: knob eases to night with weighty ease (0 -> 1)
    // 1.4-2.1s: hold night (1 -> 1)
    // 2.1-3.0s: knob eases back to day with weighty ease (1 -> 0)
    activeAnimation.current = animate(t, [0, 0, 1, 1, 0], {
      duration: 3,
      times: [0, 0.5 / 3, 1.4 / 3, 2.1 / 3, 1],
      ease: ["linear", WEIGHTY_EASE, "linear", WEIGHTY_EASE],
      repeat: Infinity,
      repeatType: "loop",
    });
  }, [t]);

  const resumeLoopAfterDelay = useCallback((fromTarget: number) => {
    if (resumeTimeout.current) {
      window.clearTimeout(resumeTimeout.current);
    }
    resumeTimeout.current = window.setTimeout(() => {
      if (fromTarget === 1) {
        // Smoothly ease back to day before entering continuous loop
        activeAnimation.current = animate(t, 0, {
          duration: 0.9,
          ease: WEIGHTY_EASE,
          onComplete: () => {
            startLoop();
          },
        });
      } else {
        startLoop();
      }
    }, 1500);
  }, [t, startLoop]);

  useEffect(() => {
    t.set(initialT);

    // Apply recording clean-mode class if ?clean is set
    if (isClean) {
      document.body.classList.add("clean-mode");
    }

    // Sync aria-checked without triggering React re-renders
    const unsubscribeT = t.on("change", (latest) => {
      if (buttonRef.current) {
        const isNight = latest >= 0.5;
        buttonRef.current.setAttribute("aria-checked", String(isNight));
      }
    });

    // If ?still=1, ?t=..., or prefers-reduced-motion: do not loop
    if (!hasStill && tParam === null && !isReducedMotion) {
      startLoop();
    }

    return () => {
      unsubscribeT();
      activeAnimation.current?.stop();
      if (resumeTimeout.current) {
        window.clearTimeout(resumeTimeout.current);
      }
      if (isClean) {
        document.body.classList.remove("clean-mode");
      }
    };
  }, [t, initialT, hasStill, isClean, tParam, isReducedMotion, startLoop]);

  // --- DRAG INTERACTION ---
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    hasMovedDuringDrag.current = false;
    dragStartX.current = e.clientX;
    dragStartT.current = t.get();

    activeAnimation.current?.stop();
    if (resumeTimeout.current) {
      window.clearTimeout(resumeTimeout.current);
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - dragStartX.current;
    if (Math.abs(deltaX) > 3) {
      hasMovedDuringDrag.current = true;
    }
    // 200px total travel range inside 360px track
    const newT = Math.max(0, Math.min(1, dragStartT.current + deltaX / 200));
    t.set(newT);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture already lost
    }

    // Spring snap to nearest end
    const target = t.get() >= 0.5 ? 1 : 0;
    activeAnimation.current = animate(t, target, {
      type: "spring",
      stiffness: 380,
      damping: 28,
    });

    if (!hasStill && tParam === null && !isReducedMotion) {
      resumeLoopAfterDelay(target);
    }

    // Reset drag movement flag after event cycle to prevent unwanted toggle click
    setTimeout(() => {
      hasMovedDuringDrag.current = false;
    }, 100);
  };

  // Keyboard accessibility: Space / Enter toggle
  const handleClick = () => {
    // Only toggle if not just finished dragging
    if (hasMovedDuringDrag.current) return;
    const current = t.get();
    const target = current >= 0.5 ? 0 : 1;

    activeAnimation.current?.stop();
    if (resumeTimeout.current) {
      window.clearTimeout(resumeTimeout.current);
    }

    activeAnimation.current = animate(t, target, {
      duration: 0.45,
      ease: WEIGHTY_EASE,
    });

    if (!hasStill && tParam === null && !isReducedMotion) {
      resumeLoopAfterDelay(target);
    }
  };

  return (
    <>
      {/* Viewport Dynamic Sky Background Layers */}
      <motion.div className="bg-layer bg-day" style={{ opacity: bgDayOpacity }} />
      <motion.div className="bg-layer bg-dusk" style={{ opacity: bgDuskOpacity }} />
      <motion.div className="bg-layer bg-night" style={{ opacity: bgNightOpacity }} />

      {/* Static Paper-Grain Overlay */}
      <svg className="grain-overlay" aria-hidden="true">
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>

      {/* Main Centered Stage */}
      <main className="stage">
        {/* Switch Hero Scaling Wrapper (scales 360px track to 45-55% of 1080x1080 frame) */}
        <div className="switch-wrapper">
          <button
            ref={buttonRef}
            role="switch"
            aria-checked={initialT >= 0.5}
            aria-label="Day and night sky switch"
            className="switch-button"
            onClick={handleClick}
          >
            {/* Switch Track with Dynamic Border and Sky */}
            <motion.div className="switch-track" style={{ borderColor: trackBorderColor }}>
              <motion.div className="track-bg track-day" style={{ opacity: bgDayOpacity }} />
              <motion.div className="track-bg track-dusk" style={{ opacity: bgDuskOpacity }} />
              <motion.div className="track-bg track-night" style={{ opacity: bgNightOpacity }} />

              {/* 8 Tiny Twinkling Stars (1.5s periodic animation seamlessly divides 3.0s loop) */}
              <motion.div className="stars-container" style={{ opacity: starsOpacity }}>
                {/* Star 1: 4-point sparkle */}
                <svg
                  className="star star-twinkle-a"
                  style={{ left: 44, top: 36, width: 15, height: 15 }}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M 10 0 Q 10 10 0 10 Q 10 10 10 20 Q 10 10 20 10 Q 10 10 10 0 Z" fill="#ffffff" />
                </svg>

                {/* Star 2: Circular star */}
                <div
                  className="star star-twinkle-b"
                  style={{
                    left: 88,
                    top: 56,
                    width: 4.5,
                    height: 4.5,
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 0 6px #ffffff",
                  }}
                />

                {/* Star 3: 4-point sparkle */}
                <svg
                  className="star star-twinkle-c"
                  style={{ left: 136, top: 32, width: 17, height: 17 }}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M 10 0 Q 10 10 0 10 Q 10 10 10 20 Q 10 10 20 10 Q 10 10 10 0 Z" fill="#ffffff" />
                </svg>

                {/* Star 4: Circular star */}
                <div
                  className="star star-twinkle-a"
                  style={{
                    left: 58,
                    top: 104,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 0 6px #ffffff",
                  }}
                />

                {/* Star 5: 4-point sparkle */}
                <svg
                  className="star star-twinkle-b"
                  style={{ left: 112, top: 86, width: 13, height: 13 }}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M 10 0 Q 10 10 0 10 Q 10 10 10 20 Q 10 10 20 10 Q 10 10 10 0 Z" fill="#ffffff" />
                </svg>

                {/* Star 6: Circular star */}
                <div
                  className="star star-twinkle-c"
                  style={{
                    left: 168,
                    top: 62,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 0 6px #ffffff",
                  }}
                />

                {/* Star 7: 4-point sparkle */}
                <svg
                  className="star star-twinkle-a"
                  style={{ left: 182, top: 110, width: 14, height: 14 }}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M 10 0 Q 10 10 0 10 Q 10 10 10 20 Q 10 10 20 10 Q 10 10 10 0 Z" fill="#ffffff" />
                </svg>

                {/* Star 8: Circular star */}
                <div
                  className="star star-twinkle-b"
                  style={{
                    left: 144,
                    top: 126,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 0 6px #ffffff",
                  }}
                />
              </motion.div>

              {/* 2 Small Soft Clouds */}
              <motion.div className="clouds-container" style={{ opacity: cloudsOpacity }}>
                {/* Cloud 1 (Upper right) */}
                <motion.div className="cloud" style={{ left: 184, top: 28, x: cloud1X }}>
                  <svg width="86" height="42" viewBox="0 0 86 42" fill="none" aria-hidden="true">
                    <path
                      d="M 16 38 C 8 38 2 32 2 24 C 2 16 8 12 16 12 C 18 5 28 2 38 2 C 49 2 58 8 62 16 C 68 14 76 18 78 24 C 84 26 84 34 78 38 Z"
                      fill="#ffffff"
                      fillOpacity="0.94"
                    />
                  </svg>
                </motion.div>

                {/* Cloud 2 (Lower center) */}
                <motion.div className="cloud" style={{ left: 126, top: 88, x: cloud2X }}>
                  <svg width="98" height="44" viewBox="0 0 98 44" fill="none" aria-hidden="true">
                    <path
                      d="M 18 40 C 9 40 3 34 3 26 C 3 18 9 14 18 14 C 21 6 32 3 44 3 C 56 3 67 9 71 18 C 77 16 87 20 89 27 C 95 29 95 37 88 40 Z"
                      fill="#ffffff"
                      fillOpacity="0.92"
                    />
                  </svg>
                </motion.div>
              </motion.div>

              {/* 3 Glowing Fireflies (30% brighter, 3.0s periodic motion divides 3.0s loop) */}
              <motion.div className="fireflies-container" style={{ opacity: firefliesOpacity }}>
                <div className="firefly firefly-cyan" style={{ left: 66, top: 68 }} />
                <div className="firefly firefly-magenta" style={{ left: 136, top: 114 }} />
                <div className="firefly firefly-yellow" style={{ left: 182, top: 48 }} />
              </motion.div>

              {/* Sliding Knob */}
              <motion.div
                className="knob"
                style={{ x: knobX }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <motion.div className="knob-disc" style={{ boxShadow: knobBoxShadow }}>
                  {/* Sun Face (t=0 to 0.5) */}
                  <motion.div className="sun-face" style={{ opacity: sunOpacity, scale: sunScale }}>
                    <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
                      <defs>
                        <radialGradient id="sunGrad" cx="35%" cy="35%" r="65%">
                          <stop offset="0%" stopColor="#fffef0" />
                          <stop offset="35%" stopColor="#fef08a" />
                          <stop offset="70%" stopColor="#fde047" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </radialGradient>
                      </defs>

                      {/* Rotating Rays (3.0s periodic revolution divides 3.0s loop seamlessly) */}
                      <g className="sun-rays">
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                          <line
                            key={deg}
                            x1="66"
                            y1="8"
                            x2="66"
                            y2="19"
                            stroke="#f59e0b"
                            strokeWidth="5.5"
                            strokeLinecap="round"
                            transform={`rotate(${deg} 66 66)`}
                          />
                        ))}
                      </g>

                      {/* Main Sun Disc */}
                      <circle cx="66" cy="66" r="42" fill="url(#sunGrad)" />
                      {/* Subtle Sun Specular Highlight */}
                      <circle cx="54" cy="52" r="30" fill="#ffffff" fillOpacity="0.22" />
                      {/* Sun Corona / Soft Outer Ring */}
                      <circle cx="66" cy="66" r="43" fill="none" stroke="#fef08a" strokeWidth="1.5" strokeOpacity="0.6" />
                    </svg>
                  </motion.div>

                  {/* Moon Face (t=0.5 to 1.0) */}
                  <motion.div className="moon-face" style={{ opacity: moonOpacity, scale: moonScale }}>
                    <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
                      <defs>
                        <radialGradient id="moonGrad" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="35%" stopColor="#f8fafc" />
                          <stop offset="70%" stopColor="#e2e8f0" />
                          <stop offset="100%" stopColor="#cbd5e1" />
                        </radialGradient>
                        <filter id="craterDepth" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="-0.8" dy="-0.8" stdDeviation="0.6" floodColor="#ffffff" floodOpacity="0.8" />
                          <feDropShadow dx="1.2" dy="1.5" stdDeviation="1.2" floodColor="#475569" floodOpacity="0.4" />
                        </filter>
                      </defs>

                      {/* Full Moon Disc filling the 132px Knob */}
                      <circle cx="66" cy="66" r="66" fill="url(#moonGrad)" />

                      {/* Craters with Dimensional Depth */}
                      <g filter="url(#craterDepth)">
                        <circle cx="42" cy="46" r="16" fill="#94a3b8" />
                        <circle cx="88" cy="82" r="19" fill="#94a3b8" />
                        <circle cx="52" cy="98" r="11" fill="#94a3b8" />
                        <circle cx="94" cy="40" r="9.5" fill="#94a3b8" />
                        <circle cx="28" cy="76" r="7.5" fill="#94a3b8" />
                        <circle cx="74" cy="52" r="8" fill="#94a3b8" />
                      </g>

                      {/* Crater Inner Shadow Cores */}
                      <circle cx="43" cy="47" r="13" fill="#64748b" fillOpacity="0.32" />
                      <circle cx="89.5" cy="83.5" r="16" fill="#64748b" fillOpacity="0.32" />
                      <circle cx="53" cy="99" r="9" fill="#64748b" fillOpacity="0.32" />
                      <circle cx="95" cy="41" r="7.5" fill="#64748b" fillOpacity="0.32" />
                      <circle cx="28.5" cy="76.5" r="6" fill="#64748b" fillOpacity="0.32" />
                      <circle cx="74.5" cy="52.5" r="6.5" fill="#64748b" fillOpacity="0.32" />

                      {/* Subtle Lunar Rim Glow */}
                      <circle cx="66" cy="66" r="65" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
                    </svg>
                  </motion.div>

                  {/* Warm Sunset Dusk Knob Overlay to ensure rich coral twilight */}
                  <motion.div className="dusk-knob-overlay" style={{ opacity: duskKnobOpacity }} />
                </motion.div>
              </motion.div>
            </motion.div>
          </button>
        </div>

        {/* Caption */}
        <motion.p className="caption" style={{ color: captionColor, opacity: captionOpacity }}>
          tiny UI experiments{SHOW_HANDLE && HANDLE ? ` · ${HANDLE}` : ""}
        </motion.p>
      </main>
    </>
  );
}
