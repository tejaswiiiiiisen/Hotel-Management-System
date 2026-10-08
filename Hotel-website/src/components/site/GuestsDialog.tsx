
import { useEffect, useState } from "react";
import { FiX, FiPlus, FiTrash2, FiUser } from "react-icons/fi";
import { useGuests } from "../../context/GuestsContext";

// While a dialog is open, flag <body> so decorative overlays (like the booking-
// bar mascot) can step out of the way.
function useModalOpenFlag() {
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);
}

const RELATIONSHIPS = [
  "Self",
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Friend",
  "Colleague",
  "Other",
];

// Dialog opened from the booking bar's "Guests" field. Add a person (name,
// relationship, age); each Add pushes them into the shared guests list that the
// account dropdown also reads from.
export default function GuestsDialog({ onClose }) {
  useModalOpenFlag();
  const { guests, addGuest, removeGuest } = useGuests();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Self");
  const [age, setAge] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    addGuest({ name: name.trim(), relationship, age: age || null });
    setName("");
    setRelationship("Self");
    setAge("");
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Add guests</h2>
            <p className="text-xs text-slate-400">Who's joining your stay?</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-steel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-steel"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy">
                Age
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-steel"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <FiPlus className="h-4 w-4" /> Add
          </button>
        </form>

        {/* Added guests list */}
        <div className="max-h-56 overflow-auto border-t border-slate-100 px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Guests ({guests.length})
          </p>
          {guests.length === 0 ? (
            <p className="text-sm text-slate-400">No guests added yet.</p>
          ) : (
            <ul className="space-y-2">
              {guests.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-steel">
                    <FiUser className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-navy">
                      {g.name}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {g.relationship}
                      {g.age ? ` · ${g.age} yrs` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGuest(g.id)}
                    aria-label={`Remove ${g.name}`}
                    className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-white hover:text-red-500"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-navy hover:bg-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
