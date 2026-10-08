
import { useEffect, useRef } from "react";

/**
 * WavyLines — the signature hero "ripple" lines, recreated in the spirit of the
 * NILS am See hero (their markup is an `svg.JS-wave` whose path `d` is rewritten
 * every animation frame). We do the same: a single requestAnimationFrame loop
 * recomputes each line's path from a sum of sine waves, so the curves genuinely
 * *morph* and drift rather than a rigid SVG sliding sideways.
 *
 * Why this over CSS/GSAP:
 *  - Real organic morphing needs per-frame path math (or GSAP's *paid* MorphSVG
 *    plugin). Summed sines give that morph for free, at ~4 tiny paths of cost.
 *  - Sine motion is periodic and continuous, so it loops forever with no restart
 *    and no visible seam — nothing is ever translated back to a start position.
 *  - The loop mutates the DOM paths via refs, so React never re-renders (0 churn).
 *
 * Each LINE has its own baseline, amplitudes, wavelengths, speeds and phases —
 * nothing shares timing, so the four lines never move together.
 */

// Normalised drawing space. preserveAspectRatio="none" stretches this to fill
// the element, so the lines always span the full width (never any empty gap)
// and stay responsive at any screen size. `non-scaling-stroke` keeps 2px crisp.
const VIEW_W = 1000;
const VIEW_H = 240;
const SAMPLES = 46; // points per line — smoothed into bezier curves below

// One entry per independent ripple line. `waves` = full sine cycles across the
// width; `speed` = drift in rad/sec (positive → crests travel right-to-left);
// two components per line so the shape is non-repeating and alive.
const LINES = [
  {
    baseY: 66,
    opacity: 0.7,
    comps: [
      { amp: 15, waves: 1.2, speed: 0.13, phase: 0.0 },
      { amp: 7, waves: 2.7, speed: -0.08, phase: 1.1 },
    ],
  },
  {
    baseY: 104,
    opacity: 0.5,
    comps: [
      { amp: 12, waves: 0.9, speed: 0.09, phase: 2.0 },
      { amp: 9, waves: 2.1, speed: 0.15, phase: 0.5 },
    ],
  },
  {
    baseY: 146,
    opacity: 0.62,
    comps: [
      { amp: 18, waves: 1.5, speed: 0.17, phase: 4.0 },
      { amp: 6, waves: 3.1, speed: -0.11, phase: 2.3 },
    ],
  },
  {
    baseY: 186,
    opacity: 0.45,
    comps: [
      { amp: 10, waves: 0.7, speed: 0.07, phase: 5.2 },
      { amp: 8, waves: 2.4, speed: 0.12, phase: 3.7 },
    ],
  },
];

const TAU = Math.PI * 2;

// y of a line at horizontal position x (0..VIEW_W) and time t (seconds).
function sampleY(line, x, t) {
  let y = line.baseY;
  for (const c of line.comps) {
    const k = (TAU * c.waves) / VIEW_W;
    y += c.amp * Math.sin(k * x + c.speed * t + c.phase);
  }
  return y;
}

// Build a smooth path from evenly spaced samples using a Catmull-Rom → cubic
// bezier conversion, so the ripples are true curves (no faceting).
function buildPath(line, t) {
  const step = VIEW_W / (SAMPLES - 1);
  const pts = new Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const x = i * step;
    pts[i] = [x, sampleY(line, x, t)];
  }

  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < SAMPLES - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(
      2
    )} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

export default function WavyLines({ className = "" }) {
  const pathRefs = useRef([]);

  useEffect(() => {
    const paths = pathRefs.current.filter(Boolean);

    // Accessibility: honour reduced-motion — draw one calm static frame, no loop.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      LINES.forEach((line, i) => {
        if (paths[i]) paths[i].setAttribute("d", buildPath(line, 0));
      });
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) / 1000; // seconds
      for (let i = 0; i < LINES.length; i++) {
        if (paths[i]) paths[i].setAttribute("d", buildPath(LINES[i], t));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Pause when the tab is hidden — no wasted frames, smooth resume.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    // The gentle CSS float (.wave-float) is a GPU-composited transform layered
    // on top of the JS morph — an extra, slower "breathing" drift.
    <svg
      className={`wave-float ${className}`}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {LINES.map((line, i) => (
        <path
          key={i}
          ref={(el) => (pathRefs.current[i] = el)}
          // Initial static frame so the ripples are visible immediately (SSR /
          // pre-hydration / JS-disabled / reduced-motion). The loop takes over.
          d={buildPath(line, 0)}
          stroke="currentColor"
          strokeOpacity={line.opacity}
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          shapeRendering="geometricPrecision"
        />
      ))}
    </svg>
  );
}
