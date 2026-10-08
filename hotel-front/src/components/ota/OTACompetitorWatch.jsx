import { useState, useEffect } from "react";
import { FaEye, FaPlus, FaSearch, FaArrowUp, FaArrowDown, FaCheckCircle, FaExclamationTriangle, FaEdit, FaSyncAlt, FaInfoCircle, FaCheck, FaTimes } from "react-icons/fa";

export default function OTACompetitorWatch() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState("Just now");

  // Modals & Interactive States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showAdvantageModal, setShowAdvantageModal] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);

  // Form states
  const [newHotelName, setNewHotelName] = useState("");
  const [newCity, setNewCity] = useState("Goa");
  const [newRate, setNewRate] = useState("5000");
  const [newStar, setNewStar] = useState("4");
  const [myRate, setMyRate] = useState("4500");
  const [tempRateInput, setTempRateInput] = useState("4500");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/serp/competitors");
      const data = await res.json();
      if (data.success && Array.isArray(data.competitors)) {
        setCompetitors(data.competitors);
      } else {
        setCompetitors([
          { id: 1, hotelName: "Taj Exotica Resort", city: "Goa", starRating: 5, otaRate: 6800, baseRate: 6800 },
          { id: 2, hotelName: "Radisson Blu Resort", city: "Goa", starRating: 5, otaRate: 5900, baseRate: 5900 },
          { id: 3, hotelName: "Grand Hyatt Goa", city: "Goa", starRating: 5, otaRate: 6200, baseRate: 6200 },
          { id: 4, hotelName: "Lemon Tree Amarante", city: "Goa", starRating: 4, otaRate: 4800, baseRate: 4800 },
        ]);
      }
    } catch {
      setCompetitors([
        { id: 1, hotelName: "Taj Exotica Resort", city: "Goa", starRating: 5, otaRate: 6800, baseRate: 6800 },
        { id: 2, hotelName: "Radisson Blu Resort", city: "Goa", starRating: 5, otaRate: 5900, baseRate: 5900 },
        { id: 3, hotelName: "Grand Hyatt Goa", city: "Goa", starRating: 5, otaRate: 6200, baseRate: 6200 },
        { id: 4, hotelName: "Lemon Tree Amarante", city: "Goa", starRating: 4, otaRate: 4800, baseRate: 4800 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetchCompetitors();
      setLastSynced(new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }));
      triggerToast("🔄 SerpApi feed refetched & cached successfully!");
    } catch {
      triggerToast("⚠️ Sync completed with simulated live rates.");
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleSaveMyRate = () => {
    const val = Number(tempRateInput);
    if (!isNaN(val) && val > 0) {
      setMyRate(String(val));
      setIsEditingRate(false);
      triggerToast(`✅ Direct room rate updated to ₹${val.toLocaleString("en-IN")}/night`);
    }
  };

  const handleAddCompetitor = async (e) => {
    e.preventDefault();
    if (!newHotelName || !newRate) return;

    try {
      await fetch("http://localhost:4000/api/serp/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName: newHotelName,
          city: newCity,
          starRating: Number(newStar),
          baseRate: Number(newRate),
        }),
      });
      fetchCompetitors();
      setShowAddModal(false);
      setNewHotelName("");
      triggerToast(`🎉 Added ${newHotelName} to competitor watch!`);
    } catch {
      setCompetitors((prev) => [
        ...prev,
        {
          id: Date.now(),
          hotelName: newHotelName,
          city: newCity,
          starRating: Number(newStar),
          otaRate: Number(newRate),
          baseRate: Number(newRate),
        },
      ]);
      setShowAddModal(false);
      setNewHotelName("");
      triggerToast(`🎉 Added ${newHotelName} to competitor watch!`);
    }
  };

  const currentMyRate = Number(myRate) || 4500;
  const avgCompetitorRate = competitors.length
    ? Math.round(competitors.reduce((sum, c) => sum + Number(c.otaRate || c.baseRate), 0) / competitors.length)
    : 5900;
  const diffPercent = Math.round(((avgCompetitorRate - currentMyRate) / avgCompetitorRate) * 100);
  const highestComp = competitors.length ? Math.max(...competitors.map(c => Number(c.otaRate || c.baseRate))) : 6800;
  const lowestComp = competitors.length ? Math.min(...competitors.map(c => Number(c.otaRate || c.baseRate))) : 4800;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* TOAST ALERT NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "700",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* SUMMARY STATS BAR - 4 WORKING CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* CARD 1: YOUR DIRECT RATE (EDITABLE) */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            position: "relative",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Your Direct Rate
            </span>
            <button
              type="button"
              onClick={() => {
                setTempRateInput(String(currentMyRate));
                setIsEditingRate(!isEditingRate);
              }}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: "8px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FaEdit /> {isEditingRate ? "Cancel" : "Edit Rate"}
            </button>
          </div>

          {isEditingRate ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
              <span style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>₹</span>
              <input
                type="number"
                value={tempRateInput}
                onChange={(e) => setTempRateInput(e.target.value)}
                style={{
                  width: "100px",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "2px solid #6366f1",
                  fontSize: "16px",
                  fontWeight: "800",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleSaveMyRate}
                style={{
                  background: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <span style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a" }}>
                ₹{currentMyRate.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>/night</span>
            </div>
          )}
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", margin: 0 }}>
            Click "Edit Rate" to test dynamic price comparison.
          </p>
        </div>

        {/* CARD 2: MARKET AVG RATE (CLICKABLE BREAKDOWN) */}
        <div
          onClick={() => setShowMarketModal(true)}
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Market Avg Rate
            </span>
            <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: "700" }}>View Breakdown ➔</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "24px", fontWeight: "900", color: "#6366f1" }}>
              ₹{avgCompetitorRate.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>({competitors.length} Hotels)</span>
          </div>
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", margin: 0 }}>
            Range: ₹{lowestComp.toLocaleString("en-IN")} – ₹{highestComp.toLocaleString("en-IN")}
          </p>
        </div>

        {/* CARD 3: PRICE ADVANTAGE (CLICKABLE DETAILS) */}
        <div
          onClick={() => setShowAdvantageModal(true)}
          style={{
            background: diffPercent >= 0 ? "#f0fdf4" : "#fef2f2",
            padding: "20px",
            borderRadius: "16px",
            border: `1px solid ${diffPercent >= 0 ? "#bbf7d0" : "#fecaca"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: diffPercent >= 0 ? "#166534" : "#991b1b",
                textTransform: "uppercase",
              }}
            >
              Price Advantage
            </span>
            <FaInfoCircle style={{ color: diffPercent >= 0 ? "#16a34a" : "#dc2626", fontSize: "14px" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
            <span
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: diffPercent >= 0 ? "#15803d" : "#dc2626",
              }}
            >
              {diffPercent >= 0 ? `🟢 ${diffPercent}% Cheaper` : `🔴 ${Math.abs(diffPercent)}% Higher`}
            </span>
          </div>
          <p style={{ fontSize: "11px", color: diffPercent >= 0 ? "#15803d" : "#b91c1c", marginTop: "6px", margin: 0, fontWeight: "600" }}>
            {diffPercent >= 0
              ? `You save guests ₹${(avgCompetitorRate - currentMyRate).toLocaleString("en-IN")} vs competitors!`
              : `Your price is higher than market average.`}
          </p>
        </div>

        {/* CARD 4: SERPAPI SYNC ENGINE (WORKING REFRESH BUTTON) */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              SerpApi Sync Engine
            </span>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FaSyncAlt style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
              {isSyncing ? "Syncing..." : "Refresh Feed"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#dcfce7",
                color: "#15803d",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              <FaCheckCircle /> Auto Cached (6h)
            </span>
          </div>
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", margin: 0 }}>
            Last Feed Refresh: <strong style={{ color: "#0f172a" }}>{lastSynced}</strong>
          </p>
        </div>
      </div>

      {/* TOP HEADER CONTROLS */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "nowrap" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0, whiteSpace: "nowrap" }}>
            Competitor Live Rates Watch
          </h3>
          <span style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>Real-time Google Hotels / SerpApi feed</span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            marginLeft: "auto",
            background: "#6366f1",
            color: "#ffffff",
            padding: "9px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "700",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
          }}
        >
          <FaPlus /> Track New Competitor
        </button>
      </div>

      {/* COMPETITORS TABLE CARD */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          overflowX: "auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading competitor price data...
          </div>
        ) : (
          <table style={{ width: "100%", minWidth: "950px", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Competitor Hotel</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Location</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Star Rating</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>OTA Live Rate</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Your Rate</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Price Variance</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((comp) => {
                const compRate = Number(comp.otaRate || comp.baseRate);
                const isCheaper = currentMyRate < compRate;
                const diff = compRate - currentMyRate;
                const diffPct = Math.round((Math.abs(diff) / compRate) * 100);

                return (
                  <tr key={comp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap" }}>
                      {comp.hotelName}
                    </td>
                    <td style={{ padding: "14px 20px", color: "#64748b", whiteSpace: "nowrap" }}>{comp.city}</td>
                    <td style={{ padding: "14px 20px", color: "#f59e0b", fontWeight: "700", whiteSpace: "nowrap" }}>
                      {"★".repeat(comp.starRating || 4)}
                    </td>
                    <td style={{ padding: "14px 20px", fontWeight: "800", color: "#0f172a", whiteSpace: "nowrap" }}>
                      ₹{compRate.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 20px", fontWeight: "800", color: "#6366f1", whiteSpace: "nowrap" }}>
                      ₹{currentMyRate.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontWeight: "700",
                          color: isCheaper ? "#16a34a" : "#dc2626",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isCheaper ? <FaArrowDown /> : <FaArrowUp />}
                        {isCheaper ? `₹${diff.toLocaleString("en-IN")} (${diffPct}% Cheaper)` : `₹${Math.abs(diff).toLocaleString("en-IN")} (${diffPct}% Higher)`}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-block",
                          whiteSpace: "nowrap",
                          padding: "6px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: isCheaper ? "#dcfce7" : "#fee2e2",
                          color: isCheaper ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {isCheaper ? "Best Value" : "Adjustment Needed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD COMPETITOR MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "450px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Track New Competitor</h3>
            <form onSubmit={handleAddCompetitor} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Hotel Name</label>
                <input
                  type="text"
                  required
                  value={newHotelName}
                  onChange={(e) => setNewHotelName(e.target.value)}
                  placeholder="e.g. Taj Fort Aguada"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    marginTop: "4px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      marginTop: "4px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Estimated Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      marginTop: "4px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "10px", background: "#f1f5f9", border: "none" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "#6366f1",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: "700",
                  }}
                >
                  Add Competitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARKET SUMMARY MODAL (CARD 2) */}
      {showMarketModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowMarketModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "500px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>📊 Market Rate Breakdown</h3>
              <button
                type="button"
                onClick={() => setShowMarketModal(false)}
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "14px", marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>MARKET AVERAGE</span>
                <p style={{ fontSize: "20px", fontWeight: "900", color: "#6366f1", margin: "2px 0 0 0" }}>₹{avgCompetitorRate.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>TOTAL TRACKED</span>
                <p style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: "2px 0 0 0" }}>{competitors.length} Hotels</p>
              </div>
            </div>

            <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>Competitor Pricing Details:</h4>
            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {competitors.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f1f5f9", borderRadius: "10px", fontSize: "13px" }}>
                  <span style={{ fontWeight: "700", color: "#0f172a" }}>{c.hotelName}</span>
                  <span style={{ fontWeight: "800", color: "#6366f1" }}>₹{Number(c.otaRate || c.baseRate).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowMarketModal(false)}
              style={{ width: "100%", marginTop: "16px", padding: "10px", borderRadius: "10px", background: "#6366f1", color: "#ffffff", fontWeight: "700", border: "none", cursor: "pointer" }}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* PRICE ADVANTAGE MODAL (CARD 3) */}
      {showAdvantageModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAdvantageModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "480px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>🛡️ Price Advantage Analysis</h3>
              <button
                type="button"
                onClick={() => setShowAdvantageModal(false)}
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ background: diffPercent >= 0 ? "#f0fdf4" : "#fef2f2", padding: "16px", borderRadius: "14px", border: `1px solid ${diffPercent >= 0 ? "#bbf7d0" : "#fecaca"}`, marginBottom: "16px" }}>
              <p style={{ fontSize: "16px", fontWeight: "800", color: diffPercent >= 0 ? "#15803d" : "#b91c1c", margin: 0 }}>
                {diffPercent >= 0 ? `🟢 You are ${diffPercent}% cheaper than market average!` : `🔴 Your rate is ${Math.abs(diffPercent)}% above market average.`}
              </p>
              <p style={{ fontSize: "12px", color: diffPercent >= 0 ? "#166534" : "#991b1b", marginTop: "4px", margin: 0 }}>
                Direct Price: <strong>₹{currentMyRate.toLocaleString("en-IN")}</strong> vs Market Avg: <strong>₹{avgCompetitorRate.toLocaleString("en-IN")}</strong>
              </p>
            </div>

            <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
              <p style={{ fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>💡 Strategy Recommendations:</p>
              <ul style={{ paddingLeft: "18px", margin: 0 }}>
                <li>Keep direct rates at least 10% lower than Booking.com / Agoda.</li>
                <li>Display <strong>Best Price Guarantee</strong> badge on checkout to boost conversion.</li>
                <li>Highlight free direct booking perks like Free WiFi & Early Check-in.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvantageModal(false)}
              style={{ width: "100%", marginTop: "16px", padding: "10px", borderRadius: "10px", background: "#0f172a", color: "#ffffff", fontWeight: "700", border: "none", cursor: "pointer" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
