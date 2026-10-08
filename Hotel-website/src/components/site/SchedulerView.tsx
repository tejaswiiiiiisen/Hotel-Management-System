
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiSlash,
  FiArrowRight,
} from "react-icons/fi";

// Room types → dot colour, used for the little booking markers on each day.
const ROOM_TYPES = [
  { name: "Deluxe", color: "bg-violet-500" },
  { name: "Suite", color: "bg-emerald-500" },
  { name: "Double", color: "bg-amber-500" },
  { name: "Single", color: "bg-sky-500" },
  { name: "Family", color: "bg-rose-500" },
];
const COLOR = Object.fromEntries(ROOM_TYPES.map((r) => [r.name, r.color]));

// Sample reservations, keyed by day-of-month — each entry a list of room types
// booked that day. Any day not listed is treated as free/available.
const BOOKINGS = {
  2: ["Deluxe", "Suite"],
  3: ["Double", "Single", "Deluxe"],
  5: ["Suite", "Family"],
  8: ["Double"],
  11: ["Deluxe", "Suite", "Double", "Family"],
  12: ["Single", "Double"],
  16: ["Suite"],
  18: ["Deluxe", "Double"],
  21: ["Family", "Suite", "Single"],
  23: ["Double", "Deluxe"],
  27: ["Single", "Double", "Suite", "Family", "Deluxe"],
  29: ["Deluxe"],
};

// A day is fully booked only when every room type is taken; otherwise some rooms
// are still free to book.
const FULLY_BOOKED = (types) => types && types.length >= ROOM_TYPES.length;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Build a 7-column grid of day numbers (with leading/trailing blanks) for a month.
function monthCells(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// The scheduler UI. Used both full-page (/scheduler) and inside the booking-bar
// modal. When `onClose` is passed the corner control closes the modal; otherwise
// it links back to the site. Pick a date to see whether it's free or booked.
export default function SchedulerView({ onClose }: any) {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(now.getDate());

  const cells = monthCells(view.year, view.month);
  const today = now.getDate();
  const isThisMonth =
    view.year === now.getFullYear() && view.month === now.getMonth();

  const bookedTypes = BOOKINGS[selected];
  const fullyBooked = FULLY_BOOKED(bookedTypes);
  const dateLabel = `${selected} ${MONTHS[view.month]} ${view.year}`;

  function shift(delta) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div
      className="mx-auto flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f7f8fb] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-navy">Scheduler</h2>
          <p className="text-xs text-slate-400">
            Pick a date to check availability
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scheduler"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-navy"
          >
            <FiX className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to="/"
            aria-label="Close scheduler"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-navy"
          >
            <FiX className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Calendar */}
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold text-navy">
                {MONTHS[view.month]}, {view.year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => shift(-1)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => shift(1)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              {WEEKDAYS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                const isToday = isThisMonth && d === today;
                const isSel = d === selected;
                const booked = d ? BOOKINGS[d] : null;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!d}
                    onClick={() => d && setSelected(d)}
                    className={
                      "flex h-16 flex-col items-center gap-1 border-b border-r border-slate-100 p-1.5 text-sm sm:h-20 " +
                      (!d ? "cursor-default bg-slate-50/40 " : "hover:bg-slate-50 ") +
                      (isSel ? "relative z-10 rounded-lg ring-2 ring-inset ring-steel " : "")
                    }
                  >
                    {d && (
                      <span
                        className={
                          "grid h-6 w-6 place-items-center rounded-full text-[13px] " +
                          (isToday
                            ? "bg-brand font-semibold text-white"
                            : "text-slate-600")
                        }
                      >
                        {d}
                      </span>
                    )}
                    {booked && (
                      <span className="mt-auto flex flex-wrap justify-center gap-0.5">
                        {booked.slice(0, 5).map((t, k) => (
                          <span
                            key={k}
                            className={`h-1.5 w-1.5 rounded-full ${COLOR[t]}`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {ROOM_TYPES.map((r) => (
                <span
                  key={r.name}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500"
                >
                  <span className={`h-2 w-2 rounded-full ${r.color}`} />
                  {r.name}
                </span>
              ))}
            </div>
          </div>

          {/* Selected-date status */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Selected date
            </h3>
            <p className="mt-1 text-2xl font-bold text-navy">{dateLabel}</p>

            {fullyBooked ? (
              // Every room type is taken → not available.
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600">
                  <FiSlash className="h-4 w-4" /> Fully booked
                </span>
                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                  All rooms are reserved on this date. Try a different day, or
                  contact us for the waiting list.
                </p>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-navy transition-colors hover:bg-slate-50"
                >
                  Contact us
                </Link>
              </div>
            ) : (
              // Some or all rooms free → available to book.
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-600">
                  <FiCheckCircle className="h-4 w-4" /> Available
                </span>
                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                  {bookedTypes
                    ? "Some rooms are still free on this date."
                    : "All rooms are free on this date."}
                </p>
                <Link
                  to={`/booking?date=${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(selected).padStart(2, "0")}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Book this date
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
