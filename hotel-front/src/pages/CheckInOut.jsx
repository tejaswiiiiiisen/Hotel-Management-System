import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RowActions from "../components/RowActions.jsx";
import { fetchCustomersFromAPI, updateCustomerPaymentAPI } from "../utils/customerStore.js";
import { fetchAllBookings, checkinBookingAPI, checkoutBookingAPI } from "../services/bookingService.js";
import { showSuccess, showError, showWarning } from "../utils/toast.js";
import { FaExclamationTriangle } from "react-icons/fa";
import PaymentWalletIcon from "../components/PaymentWalletIcon.jsx";

export default function CheckInOut() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentWarningModal, setPaymentWarningModal] = useState(null);

  async function loadData() {
    try {
      const [bookings, custData] = await Promise.all([
        fetchAllBookings(),
        fetchCustomersFromAPI()
      ]);
      const relevant = (bookings || []).filter(b => b.status === "Confirmed" || b.status === "Active Stay" || b.status === "Occupied");
      setRows(relevant);
      setCustomers(custData || []);
    } catch (err) {
      console.error("Failed to load CheckInOut data", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function checkIn(id) {
    try {
      const res = await checkinBookingAPI(id);
      if (res) {
        showSuccess("Checked in successfully");
        loadData();
      } else {
        showError("Failed to check in.");
      }
    } catch (err) {
      showError(err.message || "Error checking in");
    }
  }

  function handleCheckOutClick(row) {
    const customer = customers.find((c) => 
      c.name.trim().toLowerCase() === String(row.guestName).trim().toLowerCase() ||
      c.phone === row.guestPhone
    );
    
    const isPaid = customer ? customer.paymentStatus === "Paid" : (row.paymentStatus === "Paid" || row.paymentStatus === "Paid In Full");

    if (!isPaid) {
      setPaymentWarningModal({
        rowId: row.id || row.pkId,
        guestName: row.guestName,
        room: row.roomNumber || row.roomId,
        amount: customer ? customer.totalBill : (row.amountPaid || 2500),
        customerId: customer ? customer.id : null,
      });
      return;
    }

    if (window.confirm("Check out " + row.guestName + "?")) {
      executeCheckout(row.id || row.pkId);
    }
  }

  async function executeCheckout(bookingId) {
    try {
      const res = await checkoutBookingAPI(bookingId);
      if (res) {
        showSuccess("Checked out successfully");
        loadData();
      } else {
        showError("Failed to check out.");
      }
    } catch (err) {
      showError(err.message || "Error checking out");
    }
  }

  async function handleCollectAndCheckout() {
    try {
      if (paymentWarningModal?.customerId) {
        await updateCustomerPaymentAPI(paymentWarningModal.customerId, "Paid", paymentWarningModal.amount);
      }
      await executeCheckout(paymentWarningModal.rowId);
      setPaymentWarningModal(null);
    } catch (err) {
      showError(err.message || "Payment and checkout failed");
    }
  }

  return (
    <>
      <PageHeader title="Check-in & Check-out" subtitle="Assign room, check-in/out & enforce payment before release" />
      <section className="panel" style={{ borderRadius: "20px", padding: "24px" }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Booking</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Payment Status</th>
                <th>Check-in/out Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id || r.pkId || i}>
                  <td>#{r.id || r.pkId}</td>
                  <td>
                    <strong>{r.guestName}</strong>
                  </td>
                  <td>{r.roomNumber || r.roomId}</td>
                  <td>
                    <span
                      className={`badge ${
                        r.status === "Active Stay" || r.status === "Occupied"
                          ? "bg-success text-white"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        r.paymentStatus === "Paid" || r.paymentStatus === "Paid In Full"
                          ? "bg-success text-white"
                          : "bg-danger text-white"
                      }`}
                    >
                      {r.paymentStatus || "Unpaid"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <RowActions
                      items={[
                        {
                          label: "Check-in",
                          onClick: () => checkIn(r.id || r.pkId),
                          disabled: r.status === "Active Stay" || r.status === "Occupied",
                        },
                        {
                          label: "Check-out",
                          onClick: () => handleCheckOutClick(r),
                          disabled: r.status !== "Active Stay" && r.status !== "Occupied",
                          danger: true,
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CHECKOUT PAYMENT REQUIRED WARNING MODAL */}
      {paymentWarningModal && (
        <div
          className="modal-backdrop"
          onClick={() => setPaymentWarningModal(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "460px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "24px",
              }}
            >
              <FaExclamationTriangle />
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
              Payment Required Before Check-Out
            </h3>

            <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "#64748b", lineHeight: 1.5 }}>
              Guest <strong>{paymentWarningModal.guestName}</strong> (Room {paymentWarningModal.room}) has an unpaid balance of{" "}
              <strong style={{ color: "#dc2626" }}>
                ₹{paymentWarningModal.amount.toLocaleString("en-IN")}
              </strong>. Check-out is allowed ONLY after payment is completed.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={handleCollectAndCheckout}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
              >
                <FaMoneyBillWave /> Collect Payment & Complete Check-Out
              </button>

              <button
                type="button"
                onClick={() => setPaymentWarningModal(null)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
