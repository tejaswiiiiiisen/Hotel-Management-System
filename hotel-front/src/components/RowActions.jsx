import { FaPencilAlt, FaTrash } from "react-icons/fa";
import ActionMenu from "./ActionMenu.jsx";

// Compare labels ignoring emoji, spacing and case: "🗑️ Delete" -> "delete".
function normalize(label) {
  return String(label || "").replace(/[^a-z]/gi, "").toLowerCase();
}

// The inline icon buttons, keyed by the normalized label they match.
const INLINE = [
  { match: ["edit"], title: "Edit", Icon: FaPencilAlt, danger: false },
  { match: ["delete", "remove"], title: "Delete", Icon: FaTrash, danger: true },
];

function inlineFor(item) {
  const key = normalize(item.label);
  return INLINE.find((a) => a.match.includes(key));
}

// Row actions for a table. Edit and Delete are shown as their own icon
// buttons; anything else stays collapsed behind the "⋮" menu. `items` is the
// same list ActionMenu takes — { label, onClick, danger, disabled } — and
// falsy entries are dropped so callers can inline conditions.
export default function RowActions({ items }) {
  const visible = (items || []).filter(Boolean);
  const inline = visible.filter(inlineFor);
  const overflow = visible.filter((i) => !inlineFor(i));

  if (visible.length === 0) return null;

  return (
    <div className="row-actions">
      {inline.map((item) => {
        const { title, Icon, danger } = inlineFor(item);
        return (
          <button
            key={item.label}
            type="button"
            className={"row-action-btn" + (danger ? " danger" : "")}
            aria-label={title}
            title={title}
            disabled={item.disabled}
            onClick={item.onClick}
          >
            <Icon />
          </button>
        );
      })}
      <ActionMenu items={overflow} />
    </div>
  );
}
