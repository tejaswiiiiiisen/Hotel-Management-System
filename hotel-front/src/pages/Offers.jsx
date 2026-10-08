import React, { useState, useEffect } from "react";
import { getOffers, addOffer, updateOffer, deleteOffer, subscribeOffers } from "../utils/offerStore.js";
import { showSuccess, showError } from "../utils/toast.js";

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", code: "", discount: "", validUntil: "", status: "Active" });

  useEffect(() => {
    setOffers(getOffers());
    const unsubscribe = subscribeOffers((updated) => setOffers(updated));
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.code || !formData.discount) {
      showError("Please fill in required fields.");
      return;
    }
    addOffer(formData);
    showSuccess("Offer added successfully!");
    setIsModalOpen(false);
    setFormData({ title: "", code: "", discount: "", validUntil: "", status: "Active" });
  };

  const handleDelete = (id) => {
    deleteOffer(id);
    showSuccess("Offer deleted.");
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a" }}>Offers & Coupons</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "#6366f1",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          + Add Offer
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Title</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Code</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Discount</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Valid Until</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Status</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No offers found. Add one to get started.</td>
              </tr>
            ) : (
              offers.map((offer) => (
                <tr key={offer.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "500" }}>{offer.title}</td>
                  <td style={{ padding: "12px 16px" }}><span style={{ background: "#e0e7ff", color: "#4338ca", padding: "4px 8px", borderRadius: "4px", fontSize: "13px", fontWeight: "600" }}>{offer.code}</span></td>
                  <td style={{ padding: "12px 16px" }}>{offer.discount}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{offer.validUntil || "N/A"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      background: offer.status === "Active" ? "#dcfce7" : "#fee2e2",
                      color: offer.status === "Active" ? "#166534" : "#991b1b",
                      padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600"
                    }}>
                      {offer.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "600" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{ background: "#fff", width: "400px", padding: "24px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px" }}>Add New Offer</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px" }}>Offer Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} placeholder="e.g. Winter Special" />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px" }}>Coupon Code</label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} placeholder="e.g. WINTER25" />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px" }}>Discount Value</label>
                <input type="text" name="discount" value={formData.discount} onChange={handleChange} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} placeholder="e.g. 25% or ₹500" />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px" }}>Valid Until</label>
                <input type="date" name="validUntil" value={formData.validUntil} onChange={handleChange} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "10px 16px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#475569" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Save Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
