// Thin line icons used across the public hotel site — sized by the parent's
// font-size / width, coloured by `currentColor` so they inherit text colour.
interface IconProps {
  className?: string;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </svg>
  );
}

export function GiftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={1.4}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9" />
      <line x1="12" y1="8" x2="12" y2="21" />
      <path d="M12 8S10.5 3.5 8 4.2 9.5 8 12 8Z" />
      <path d="M12 8s1.5-4.5 4-3.8S14.5 8 12 8Z" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={1.4}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <line x1="8" y1="3" x2="8" y2="6.5" />
      <line x1="16" y1="3" x2="16" y2="6.5" />
    </svg>
  );
}

export function AccessibilityIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={1.4}>
      <circle cx="12" cy="4" r="1.8" />
      <path d="M4 8.5c2.6 1 5.2 1.4 8 1.4s5.4-.4 8-1.4" />
      <path d="M12 9.9V15" />
      <path d="M12 15l-3 6M12 15l3 6" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={1.6}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}

export function ChevronDown({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ArrowRight({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M14 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowUp({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <line x1="12" y1="20" x2="12" y2="4" />
      <path d="M6 10l6-6 6 6" />
    </svg>
  );
}
