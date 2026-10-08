import { useEffect, useMemo, useState } from "react";
import StatCard from "./StatCard.jsx";
import ReviewCard from "./ReviewCard.jsx";
import { fetchLiveReviews, BACKEND_API_BASE_URL } from "../../services/aiService.js";
import { getAuthHeaders } from "../../auth.js";

function SentimentDashboard({ reviews: propReviews }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchLiveReviews();
      setReviews(Array.isArray(result.reviews) ? result.reviews : []);
    } catch (err) {
      console.error("Review dashboard error:", err);
      setError(err.message || "Failed to load reviews from Express backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const clearReviews = async () => {
    const confirmed = window.confirm(
      "⚠️ This will permanently delete customer reviews from the database.\n\nDo you want to continue?"
    );
    if (!confirmed) return;

    try {
      setClearing(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${BACKEND_API_BASE_URL}/api/reviews`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to clear reviews.");
      }

      setReviews([]);
      setSuccess("All reviews cleared successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Unable to clear reviews.");
    } finally {
      setClearing(false);
    }
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    reviews.forEach((r) => {
      const s = String(r.sentiment || "").toLowerCase();
      if (s.includes("pos")) positive++;
      else if (s.includes("neg")) negative++;
      else neutral++;
    });

    return { total, positive, negative, neutral };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (filter === "all") return reviews;
    return reviews.filter((r) => {
      const s = String(r.sentiment || "").toLowerCase();
      return s.includes(filter);
    });
  }, [reviews, filter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* TOP HEADER & ACTION BUTTONS */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "var(--text-color, #0f172a)" }}>
            Review Sentiment Analytics
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
            Real-time classification of guest ratings and OTA reviews powered by TensorFlow NLP.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={loadReviews}
            disabled={loading}
            className="hotel-ai-btn-secondary"
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            onClick={clearReviews}
            disabled={clearing || reviews.length === 0}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              fontWeight: "700",
              fontSize: "13px",
              cursor: reviews.length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {clearing ? "Clearing..." : "🗑️ Clear Reviews"}
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard title="Total Reviews" value={stats.total} type="total" icon="💬" />
        <StatCard title="Positive Feedback" value={stats.positive} type="positive" icon="✅" />
        <StatCard title="Neutral Feedback" value={stats.neutral} type="neutral" icon="⚖️" />
        <StatCard title="Negative Feedback" value={stats.negative} type="negative" icon="⚠️" />
      </div>

      {/* STATUS ALERTS */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "13px", fontWeight: "600" }}>
          ✅ {success}
        </div>
      )}

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "12px" }}>
        {["all", "pos", "neu", "neg"].map((tab) => {
          const labels = { all: "All Reviews", pos: "Positive", neu: "Neutral", neg: "Negative" };
          const active = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: active ? "1px solid #6366f1" : "1px solid var(--border-color, #e2e8f0)",
                background: active ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "var(--card-bg, #ffffff)",
                color: active ? "#ffffff" : "var(--text-muted, #64748b)",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* REVIEWS LIST */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
          Loading review sentiment insights...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div
          className="hotel-ai-card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--text-muted, #64748b)",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📝</div>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700", color: "var(--text-color, #0f172a)" }}>
            No reviews found
          </h3>
          <p style={{ margin: 0, fontSize: "13px" }}>
            Submit a guest review using the Review Submission tab to see real-time AI sentiment analysis.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {filteredReviews.map((r, i) => (
            <ReviewCard
              key={r.id || i}
              review={r.review_text || r.review || r.comment}
              rating={r.rating}
              sentiment={r.sentiment}
              date={r.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SentimentDashboard;
