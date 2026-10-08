import { showSuccess, showError, showWarning, showInfo } from "../utils/toast.js";
import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RowActions from "../components/RowActions.jsx";
import { getUserRole, getUserName } from "../auth.js";
import {
  getCustomers,
  fetchCustomersFromAPI,
  updatePaymentStatusAPI,
  addCustomerToAPI,
} from "../utils/customerStore.js";
import { getRooms, fetchRoomsFromApi } from "../utils/roomStore.js";
import {
  FaReceipt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaPrint,
  FaPlus,
  FaEye,
  FaTimes,
  FaUser,
  FaHotel,
} from "react-icons/fa";
import PaymentWalletIcon from "../components/PaymentWalletIcon.jsx";

export default function Billing() {
  const [customers, setCustomers] = useState(getCustomers);
  const [rooms, setRooms] = useState(getRooms);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReceiptInv, setSelectedReceiptInv] = useState(null);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);

  // New Invoice Form state
  const [newInvForm, setNewInvForm] = useState({
    guestName: "",
    phone: "",
    roomNumber: "101",
    amount: "2500",
    paymentStatus: "Paid",
  });

  const isGuest = getUserRole() === "guest";
  const currentUserName = getUserName();

  useEffect(() => {
    fetchCustomersFromAPI().then((cList) => {
      if (Array.isArray(cList) && cList.length > 0) setCustomers(cList);
    });
    fetchRoomsFromApi().then((rList) => {
      if (Array.isArray(rList) && rList.length > 0) setRooms(rList);
    });
  }, []);

  // Build unified Invoices List from Customers & Booked Rooms
  const invoiceMap = new Map();

  // 1. From Customers Store (includes room bookings synced to customerStore)
  customers.forEach((c) => {
    const invId = c.invoiceId || `INV-${c.id}`;
    const total = Number(c.totalBill || (typeof c.amount === "number" ? c.amount : parseInt(String(c.amount || "").replace(/[^0-9]/g, "")) || 2500));
    const paid = Number(
      c.paidAmount !== undefined
        ? c.paidAmount
        : c.paymentStatus === "Paid"
        ? total
        : 0
    );
    const status =
      c.paymentStatus ||
      (paid >= total ? "Paid" : paid > 0 ? "Partial" : "Unpaid");

    invoiceMap.set(invId, {
      id: invId,
      customerId: c.id,
      guest: c.name,
      phone: c.phone || "+91 98765 00000",
      email: c.email || `${c.name.toLowerCase().replace(/\s+/g, "")}@mail.com`,
      room: c.roomBooked || "Room 101",
      checkIn: c.checkIn || c.lastVisit || "18 Aug 2026",
      checkOut: c.checkOut || "20 Aug 2026",
      stayDays: c.stayDays || 2,
      amount: total,
      paid: paid,
      status: status,
      paymentMethod: c.paymentMethod || "Direct Payment",
      document: c.document || null,
    });
  });

  // 2. From Rooms Store (Booked Rooms with active reservation info)
  rooms.forEach((r) => {
    if (r.booking && r.booking.guestName) {
      const b = r.booking;
      const invId = b.bookingId
        ? `INV-${b.bookingId.replace("#B-", "")}`
        : `INV-ROOM-${r.number || r.roomNumber}`;

      if (!invoiceMap.has(invId)) {
        const total = Number(
          b.totalBill || (r.price || r.pricePerNight || 2500) * 2
        );
        const paid = Number(
          b.paidAmount !== undefined
            ? b.paidAmount
            : b.paymentStatus === "Unpaid"
            ? 0
            : total
        );
        const status = b.paymentStatus || (paid >= total ? "Paid" : "Unpaid");

        invoiceMap.set(invId, {
          id: invId,
          customerId: null,
          guest: b.guestName,
          phone: b.phone || "+91 98765 00000",
          email: `${b.guestName.toLowerCase().replace(/\s+/g, "")}@mail.com`,
          room: `Room ${r.number || r.roomNumber}`,
          checkIn: b.checkIn || "18 Aug 2026",
          checkOut: b.checkOut || "20 Aug 2026",
          stayDays: 2,
          amount: total,
          paid: paid,
          status: status,
          paymentMethod: b.paymentMethod || "Cash/Card",
          document: b.document || null,
        });
      }
    }
  });

  const allInvoices = Array.from(invoiceMap.values());

  // Filter invoices for Guest role vs Staff/Admin role
  const scopedInvoices = isGuest
    ? allInvoices.filter(
        (i) => i.guest.toLowerCase().trim() === currentUserName.toLowerCase().trim()
      )
    : allInvoices;

  // Filter by Search Query & Status Filter
  const filteredInvoices = scopedInvoices.filter((inv) => {
    if (
      statusFilter !== "all" &&
      inv.status.toLowerCase() !== statusFilter.toLowerCase()
    ) {
      return false;
    }
    if (q.trim()) {
      const query = q.toLowerCase().trim();
      const match =
        inv.id.toLowerCase().includes(query) ||
        inv.guest.toLowerCase().includes(query) ||
        inv.room.toLowerCase().includes(query) ||
        inv.phone.toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalRevenue = scopedInvoices.reduce((acc, i) => acc + i.paid, 0);
  const totalPending = scopedInvoices.reduce(
    (acc, i) => acc + Math.max(0, i.amount - i.paid),
    0
  );
  const paidCount = scopedInvoices.filter((i) => i.status === "Paid").length;
  const unpaidCount = scopedInvoices.filter((i) => i.status !== "Paid").length;

  // Handlers
  async function handleMarkPaid(inv) {
    if (inv.customerId) {
      await updatePaymentStatusAPI(inv.customerId, "Paid");
      const updatedList = await fetchCustomersFromAPI();
      setCustomers(updatedList);
    } else {
      // Local fallback for room booking
      setCustomers((prev) =>
        prev.map((c) =>
          c.name.trim().toLowerCase() === inv.guest.trim().toLowerCase()
            ? { ...c, paymentStatus: "Paid", paidAmount: c.totalBill || inv.amount }
            : c
        )
      );
    }
  }

  async function handleCreateInvoice(e) {
    e.preventDefault();
    if (!newInvForm.guestName.trim() || !newInvForm.amount) {
      showWarning("Please enter Guest Name and Bill Amount.");
      return;
    }

    const billAmt = Number(newInvForm.amount);
    const newGuestObj = {
      name: newInvForm.guestName.trim(),
      phone: newInvForm.phone.trim() || "+91 98765 00000",
      roomBooked: `Room ${newInvForm.roomNumber}`,
      totalBill: billAmt,
      paidAmount: newInvForm.paymentStatus === "Paid" ? billAmt : 0,
      paymentStatus: newInvForm.paymentStatus,
    };

    const updated = await addCustomerToAPI(newGuestObj);
    setCustomers(updated);
    setIsAddInvoiceOpen(false);
    setNewInvForm({
      guestName: "",
      phone: "",
      roomNumber: "101",
      amount: "2500",
      paymentStatus: "Paid",
    });
  }

  return (
    <>
      <PageHeader
        title="Billing & Payment Management"
        subtitle={
          isGuest
            ? "Your room booking invoices, payments & receipts"
            : "Generate room invoices, record payments, view history & print receipts"
        }
        action={
          !isGuest && (
            <button
              className="btn-primary"
              onClick={() => setIsAddInvoiceOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "12px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
              }}
            >
              <FaPlus /> + New Invoice
            </button>
          )
        }
      />

      {/* METRICS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#dcfce7",
              color: "#166534",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            <PaymentWalletIcon color="#166534" size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
              Revenue Collected
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            <FaExclamationTriangle />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
              Pending Payments
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#dc2626", marginTop: "2px" }}>
              ₹{totalPending.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#e0e7ff",
              color: "#4338ca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            <FaReceipt />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
              Total Invoices
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
              {scopedInvoices.length}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#f0fdf4",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            <FaCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
              Paid Invoices
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#16a34a", marginTop: "2px" }}>
              {paidCount} Paid / {unpaidCount} Pending
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#ffffff",
            padding: "8px 16px",
            borderRadius: "14px",
            border: "1px solid #cbd5e1",
            flex: "1",
            maxWidth: "380px",
          }}
        >
          <FaSearch style={{ color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search invoice ID, guest name, room..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {["all", "Paid", "Unpaid", "Partial"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                border: statusFilter === st ? "none" : "1px solid #cbd5e1",
                background: statusFilter === st ? "#667eea" : "#ffffff",
                color: statusFilter === st ? "#ffffff" : "#475569",
              }}
            >
              {st === "all" ? "All Invoices" : st}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE OF INVOICES */}
      <section className="panel" style={{ borderRadius: "20px", padding: "20px", background: "#ffffff" }}>
        {filteredInvoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <FaReceipt style={{ fontSize: "36px", color: "#cbd5e1", marginBottom: "12px" }} />
            <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "16px" }}>No Invoices Found</h4>
            <p style={{ margin: 0, fontSize: "13.5px" }}>No room booking bills match your current search or status filter.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Invoice ID</th>
                <th style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Guest Name</th>
                <th style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Room</th>
                <th style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Total Bill</th>
                <th style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Paid Amount</th>
                <th style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === "Paid";
                const isPartial = inv.status === "Partial";

                return (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedReceiptInv(inv)}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                  >
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#667eea" }}>
                      {inv.id}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>{inv.guest}</div>
                      <div style={{ fontSize: "11.5px", color: "#64748b" }}>{inv.phone}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "600", color: "#334155" }}>
                      {inv.room}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#0f172a" }}>
                      ₹{inv.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: isPaid ? "#166534" : "#0f172a" }}>
                      ₹{inv.paid.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          background: isPaid ? "#dcfce7" : isPartial ? "#fef3c7" : "#fee2e2",
                          color: isPaid ? "#15803d" : isPartial ? "#b45309" : "#b91c1c",
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}
                      >
                        <RowActions
                          items={[
                            ...(!isPaid && !isGuest
                              ? [
                                  {
                                    label: "Record Payment (Mark Paid)",
                                    onClick: () => handleMarkPaid(inv),
                                  },
                                ]
                              : []),
                            {
                              label: "Print / View Receipt",
                              onClick: () => setSelectedReceiptInv(inv),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* PRINTABLE INVOICE / RECEIPT MODAL */}
      {selectedReceiptInv && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSelectedReceiptInv(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              width: "560px",
              maxWidth: "100%",
              padding: "32px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* INVOICE HEADER */}
            <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", marginBottom: "20px", borderBottom: "2px solid #f1f5f9", pb: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                  <FaHotel />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Grand Hotel Management</h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Official Guest Receipt & Bill</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#667eea" }}>{selectedReceiptInv.id}</div>
                <div style={{ fontSize: "11.5px", color: "#64748b" }}>Date: {selectedReceiptInv.checkIn}</div>
              </div>
            </div>

            {/* GUEST & ROOM INFO GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", background: "#f8fafc", padding: "16px", borderRadius: "16px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Guest Details</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{selectedReceiptInv.guest}</div>
                <div style={{ fontSize: "12px", color: "#475569" }}>{selectedReceiptInv.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Room & Stay</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{selectedReceiptInv.room}</div>
                <div style={{ fontSize: "12px", color: "#475569" }}>{selectedReceiptInv.checkIn} → {selectedReceiptInv.checkOut}</div>
              </div>
            </div>

            {/* BILL BREAKDOWN TABLE */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left" }}>
                  <th style={{ padding: "8px 0", fontSize: "12px", color: "#64748b" }}>Description</th>
                  <th style={{ padding: "8px 0", fontSize: "12px", color: "#64748b", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 0", fontSize: "13.5px", fontWeight: "600" }}>Room Stay Charge ({selectedReceiptInv.stayDays} Nights)</td>
                  <td style={{ padding: "10px 0", fontSize: "13.5px", fontWeight: "700", textAlign: "right" }}>₹{selectedReceiptInv.amount.toLocaleString("en-IN")}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 0", fontSize: "13.5px", color: "#64748b" }}>Taxes & Service Charges</td>
                  <td style={{ padding: "10px 0", fontSize: "13.5px", color: "#64748b", textAlign: "right" }}>Included</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 0", fontSize: "16px", fontWeight: "800" }}>Total Amount Due</td>
                  <td style={{ padding: "12px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a", textAlign: "right" }}>₹{selectedReceiptInv.amount.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", fontSize: "13.5px", fontWeight: "700", color: "#166534" }}>Paid Amount</td>
                  <td style={{ padding: "6px 0", fontSize: "15px", fontWeight: "800", color: "#166534", textAlign: "right" }}>₹{selectedReceiptInv.paid.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: selectedReceiptInv.status === "Paid" ? "#dcfce7" : "#fee2e2", color: selectedReceiptInv.status === "Paid" ? "#15803d" : "#b91c1c" }}>
                Status: {selectedReceiptInv.status}
              </span>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: "10px 18px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#0f172a", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FaPrint /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptInv(null)}
                  style={{ padding: "10px 18px", borderRadius: "12px", border: "none", background: "#0f172a", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW INVOICE MANUAL MODAL */}
      {isAddInvoiceOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setIsAddInvoiceOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              width: "480px",
              maxWidth: "100%",
              padding: "28px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Create New Invoice</h3>
              <button onClick={() => setIsAddInvoiceOpen(false)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b" }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Guest Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newInvForm.guestName}
                  onChange={(e) => setNewInvForm({ ...newInvForm, guestName: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={newInvForm.phone}
                  onChange={(e) => setNewInvForm({ ...newInvForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Room Number</label>
                  <input
                    type="text"
                    placeholder="101"
                    value={newInvForm.roomNumber}
                    onChange={(e) => setNewInvForm({ ...newInvForm, roomNumber: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Bill Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={newInvForm.amount}
                    onChange={(e) => setNewInvForm({ ...newInvForm, amount: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Payment Status</label>
                <select
                  value={newInvForm.paymentStatus}
                  onChange={(e) => setNewInvForm({ ...newInvForm, paymentStatus: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none" }}
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Generate Invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
