import { AccessibilityIcon } from "./icons";

// Fixed accessibility control, bottom-right on every page.
export default function AccessibilityFab() {
  return (
    <button
      type="button"
      aria-label="Accessibility options"
      className="fixed bottom-5 right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-lg transition-opacity hover:opacity-90 sm:h-14 sm:w-14 sm:right-6"
    >
      <AccessibilityIcon className="h-6 w-6 sm:h-7 sm:w-7" />
    </button>
  );
}
