
import { useEffect } from "react";
import SchedulerView from "./SchedulerView";

// Overlay wrapper around the shared scheduler UI — opened from the booking bar's
// calendar button. Clicking the dimmed backdrop closes it.
export default function SchedulerModal({ onClose }) {
  // Flag <body> while open so the booking-bar mascot steps out of the way.
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3 sm:p-6"
      onClick={onClose}
    >
      <SchedulerView onClose={onClose} />
    </div>
  );
}
