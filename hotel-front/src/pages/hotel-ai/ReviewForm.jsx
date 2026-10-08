import { useState } from "react";
import { analyzeReview } from "../../services/aiService.js";

function ReviewForm({ onReviewAnalyzed }) {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!review.trim()) {
      setError("Please enter your hotel review.");
      return;
    }

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    try {
      setLoading(true);

      const result = await analyzeReview({
        review: review.trim(),
        rating,
      });

      const newReview = {
        id: Date.now(),
        review: review.trim(),
        rating,
        sentiment: result.sentiment,
        createdAt: new Date().toISOString(),
      };

      setLastResult(result);
      if (onReviewAnalyzed) {
        onReviewAnalyzed(newReview);
      }

      setReview("");
      setRating(0);
      setHoverRating(0);
      setMessage(`Review analyzed & saved successfully! Classified as: ${result.sentiment}`);
    } catch (err) {
      setError(err.message || "Unable to analyze the review. Ensure the Python AI server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "10px" }}>
      {/* HEADER */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(99, 102, 241, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            💬
          </div>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#6366f1", textTransform: "uppercase", letterSpacing: "1px" }}>
              NLP Deep Learning
            </span>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "var(--text-color, #0f172a)" }}>
              Submit & Classify Guest Review
            </h1>
          </div>
        </div>
        <p style={{ margin: 0, color: "var(--text-muted, #64748b)", fontSize: "14px" }}>
          Analyze feedback using our trained TensorFlow / Keras natural language model to automatically detect guest satisfaction.
        </p>
      </div>

      {/* FORM CARD */}
      <div
        className="hotel-ai-card"
        style={{
          borderRadius: "20px",
          padding: "28px",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* STAR RATING */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text-color, #1e293b)", marginBottom: "8px" }}>
              Star Rating <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "32px",
                    color: star <= (hoverRating || rating) ? "#f59e0b" : "var(--border-color, #cbd5e1)",
                    transition: "transform 0.15s ease",
                    padding: "2px",
                  }}
                  onFocus={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                  onBlur={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  ★
                </button>
              ))}
              <span style={{ marginLeft: "12px", fontSize: "14px", fontWeight: "700", color: "var(--text-muted, #64748b)" }}>
                {rating > 0 ? `${rating} of 5 Stars` : "Select a rating"}
              </span>
            </div>
          </div>

          {/* REVIEW TEXTAREA */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text-color, #1e293b)", marginBottom: "8px" }}>
              Review Text <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="e.g. The room was exceptionally clean, the lake view was breathtaking and staff was very polite!"
              rows={5}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--input-bg, #f8fafc)",
                color: "var(--text-color, #0f172a)",
                fontSize: "14px",
                lineHeight: "1.6",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* MESSAGES */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#10b981",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              ✅ {message}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 28px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Analyzing Sentiment..." : "⚡ Run Sentiment Prediction"}
          </button>
        </form>

        {/* RECENT PREDICTION BADGE */}
        {lastResult && (
          <div
            style={{
              marginTop: "24px",
              padding: "18px",
              borderRadius: "14px",
              background: "var(--bg-secondary, #f1f5f9)",
              border: "1px solid var(--border-color, #e2e8f0)",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
              Latest Model Prediction
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background:
                    String(lastResult.sentiment).toLowerCase().includes("pos")
                      ? "#10b981"
                      : String(lastResult.sentiment).toLowerCase().includes("neg")
                      ? "#ef4444"
                      : "#f59e0b",
                  color: "#ffffff",
                }}
              >
                {lastResult.sentiment}
              </span>
              <span style={{ fontSize: "14px", color: "#475569" }}>
                Score: <strong>{lastResult.rating}/5</strong> Stars
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewForm;
