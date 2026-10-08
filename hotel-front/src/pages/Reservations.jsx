import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RowActions from "../components/RowActions.jsx";
import { logAction } from "../audit.js";
import { getUserRole, getUserName } from "../auth.js";

const seed = [
  {
    id: "#B-1042",
    guest: "Aarav Sharma",
    room: "Deluxe 204",
    checkin: "2026-07-20",
    checkout: "2026-07-23",
    status: "Reserved",
  },

  {
    id: "#B-1041",
    guest: "Priya Verma",
    room: "Suite 501",
    checkin: "2026-07-21",
    checkout: "2026-07-25",
    status: "Reserved",
  },

  {
    id: "#B-1040",
    guest: "John Miller",
    room: "Standard 108",
    checkin: "2026-07-18",
    checkout: "2026-07-20",
    status: "Completed",
  },

  {
    id: "#B-1039",
    guest: "Sara Khan",
    room: "Deluxe 210",
    checkin: "2026-07-19",
    checkout: "2026-07-22",
    status: "Cancelled",
  },
];

export default function Reservations() {
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");

  const isGuest = getUserRole() === "guest";

  function cancel(id) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id
          ? { ...row, status: "Cancelled" }
          : row
      )
    );

    logAction(`Cancelled booking ${id}`, "Reservation");
  }

  function edit(id) {
    logAction(`Edited booking details ${id}`, "Reservation");
  }

  // Guests only see their own bookings
  const scoped = isGuest
    ? rows.filter((row) => row.guest === getUserName())
    : rows;

  const searchText = q.toLowerCase();

  const filtered = scoped.filter(
    (row) =>
      row.guest.toLowerCase().includes(searchText) ||
      row.id.toLowerCase().includes(searchText) ||
      row.room.toLowerCase().includes(searchText)
  );

  return (
    <>
      <PageHeader
        title="Reservation Management"
        subtitle="Book, view, update, cancel bookings & history"
        action={
          !isGuest && (
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                console.log("New Booking");
              }}
            >
              + New Booking
            </button>
          )
        }
      />

      <section className="panel">

        <input
          className="search"
          placeholder="Search by guest or booking ID..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>

                  <td>{row.id}</td>

                  <td>{row.guest}</td>

                  <td>{row.room}</td>

                  <td>{row.checkin}</td>

                  <td>{row.checkout}</td>

                  <td>
                    <span
                      className={
                        "badge " +
                        row.status.toLowerCase()
                      }
                    >
                      {row.status}
                    </span>
                  </td>

                  <td>
                    <RowActions
                      items={[
                        !isGuest && {
                          label: "Edit",
                          onClick: () => edit(row.id),
                        },

                        {
                          label: "Cancel",
                          danger: true,
                          onClick: () => cancel(row.id),
                        },
                      ].filter(Boolean)}
                    />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            No reservations found.
          </div>
        )}

      </section>
    </>
  );
}