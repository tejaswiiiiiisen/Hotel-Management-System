import SampleModule from "../components/SampleModule.jsx";
import { getUserRole, getUserName } from "../auth.js";

const allRows = [
  ["Aarav Sharma", "Gold", "1,240", "5", "20 Jul 2026", "Active"],
  ["John Miller", "Platinum", "3,880", "8", "18 Jul 2026", "Active"],
  ["Sara Khan", "Silver", "420", "1", "19 Jul 2026", "Active"],
];

export default function CRM() {
  // Guests only ever see their OWN loyalty row; staff see all guests.
  const isGuest = getUserRole() === "guest";
  const rows = isGuest ? allRows.filter((r) => r[0] === getUserName()) : allRows;

  return (
    <SampleModule
      title="CRM & Guest Loyalty"
      subtitle={isGuest ? "Your points, tier & offers" : "Turn repeat guests into a retention asset"}
      features={[
        "Guest profile with stay history and preferences",
        "Loyalty points / membership tiers",
        "Targeted offers, automated birthday / anniversary emails",
        "Corporate & travel-agent accounts with negotiated rates",
      ]}
      columns={["Guest", "Tier", "Points", "Stays", "Last Visit", "Status"]}
      rows={rows}
    />
  );
}
