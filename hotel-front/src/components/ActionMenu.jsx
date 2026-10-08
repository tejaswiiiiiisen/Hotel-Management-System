import { useEffect, useRef, useState } from "react";
import { FaEllipsisV } from "react-icons/fa";

// Row actions collapsed behind a "⋮" button. `items` is a list of
// { label, onClick, danger, disabled } — falsy entries are dropped so callers
// can inline conditions like `!isGuest && { label: "Edit", ... }`.
export default function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const visible = (items || []).filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <div className="action-menu" ref={ref}>
      <button
        type="button"
        className={"action-menu-btn" + (open ? " open" : "")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Actions"
        title="Actions"
        onClick={() => setOpen((o) => !o)}
      >
        <FaEllipsisV />
      </button>

      {open && (
        <div className="action-menu-list" role="menu">
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={"action-menu-item" + (item.danger ? " danger" : "")}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                if (item.onClick) item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
