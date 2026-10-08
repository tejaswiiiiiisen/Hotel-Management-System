import { Link } from "react-router-dom";
import { UserIcon } from "./icons";

// Account / login control, fixed to the top-right on every page — it stays put
// while the rest of the site scrolls beneath it. Icon only, no background.
// Clicking it opens the login page.
export default function TopControls() {
  return (
    <div className="fixed right-6 top-6 z-50 flex">
      <Link
        to="/login"
        aria-label="Login"
        className="text-navy transition-opacity hover:opacity-70 [filter:drop-shadow(0_1px_2px_rgba(255,255,255,0.5))]"
      >
        <UserIcon className="h-7 w-7" />
      </Link>
    </div>
  );
}
