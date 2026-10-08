// A cute, original anime-style chibi mascot (a little lakeside-hotel receptionist
// waving hello). Purely decorative — drawn inline as SVG so it themes with the
// brand palette and needs no external asset. It gently bobs, and her raised hand
// waves; both animations pause for users who prefer reduced motion.
export default function AnimeMascot({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 110 130"
      className={className}
      role="img"
      aria-label="Friendly hotel mascot waving"
    >
      <g className="mascot-bob">
        {/* soft shadow under the mascot */}
        <ellipse cx="55" cy="122" rx="26" ry="5" fill="rgba(31,34,51,0.18)" />

        {/* hair (back) */}
        <ellipse cx="55" cy="52" rx="33" ry="31" fill="#6d5bd0" />

        {/* body / uniform */}
        <path
          d="M37 78 Q55 72 73 78 L77 108 Q55 118 33 108 Z"
          fill="#2a2e45"
        />
        {/* collar + buttons in brand indigo */}
        <path d="M50 74 L55 84 L60 74 Z" fill="#667eea" />
        <circle cx="55" cy="90" r="2" fill="#667eea" />
        <circle cx="55" cy="98" r="2" fill="#667eea" />

        {/* left arm resting down */}
        <path d="M70 82 Q78 90 74 104 Q70 106 68 102 Q70 92 64 84 Z" fill="#ffe3cf" />

        {/* head */}
        <circle cx="55" cy="50" r="27" fill="#ffe3cf" />
        {/* blush */}
        <ellipse cx="40" cy="58" rx="4.5" ry="2.6" fill="#ff9d8a" opacity="0.75" />
        <ellipse cx="70" cy="58" rx="4.5" ry="2.6" fill="#ff9d8a" opacity="0.75" />
        {/* eyes */}
        <ellipse cx="46" cy="52" rx="4.2" ry="6" fill="#2d2748" />
        <ellipse cx="64" cy="52" rx="4.2" ry="6" fill="#2d2748" />
        <circle cx="47.6" cy="49.5" r="1.7" fill="#ffffff" />
        <circle cx="65.6" cy="49.5" r="1.7" fill="#ffffff" />
        {/* smile */}
        <path
          d="M50 61 Q55 66 60 61"
          fill="none"
          stroke="#c56a4e"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* hair (front bangs) */}
        <path
          d="M28 50 C28 24 82 24 82 50 C82 42 72 38 66 41 C61 32 49 32 44 41 C38 38 28 42 28 50 Z"
          fill="#7c6ce0"
        />
        {/* little bellhop cap */}
        <ellipse cx="55" cy="26" rx="15" ry="6" fill="#667eea" />
        <path d="M43 26 Q55 14 67 26 Z" fill="#764ba2" />

        {/* waving right arm (pivots at the shoulder) */}
        <g className="mascot-wave">
          <path d="M39 80 L31 58 Q29 52 34 52 Q39 52 40 58 L47 78 Z" fill="#ffe3cf" />
          <circle cx="32" cy="52" r="6" fill="#ffe3cf" />
        </g>

        {/* sparkles for that anime touch */}
        <path d="M22 46 l1.4 3 3 1.4 -3 1.4 -1.4 3 -1.4 -3 -3 -1.4 3 -1.4 Z" fill="#ffd76a" />
        <path d="M86 62 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1 Z" fill="#ffd76a" />
      </g>
    </svg>
  );
}
