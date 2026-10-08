import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import CustomerDashboard from "./CustomerDashboard.jsx";
import SentimentDashboard from "./SentimentDashboard.jsx";
import RevenueDashboard from "./RevenueDashboard.jsx";
import CustomerSegmentation from "./CustomerSegmentation.jsx";
import BookingCancellation from "./BookingCancellation.jsx";
import ReviewForm from "./ReviewForm.jsx";
import Chatbot from "./Chatbot.jsx";
import { checkAiHealth } from "../../services/aiService.js";
import "./hotel-ai.css";
import {
  FaRobot,
  FaChartLine,
  FaStar,
  FaUsers,
  FaShieldAlt,
  FaCommentDots,
  FaThLarge,
} from "react-icons/fa";

const TABS = [
  { id: "overview", label: "AI Overview", icon: FaThLarge },
  { id: "sentiment", label: "Review Sentiment", icon: FaStar },
  { id: "revenue", label: "Revenue Prediction", icon: FaChartLine },
  { id: "segmentation", label: "Customer Segmentation", icon: FaUsers },
  { id: "cancellation", label: "Cancellation Risk", icon: FaShieldAlt },
  { id: "review-form", label: "Review Submission", icon: FaCommentDots },
];

export default function HotelAiHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(currentTab);
  const [aiHealth, setAiHealth] = useState({ online: null, message: "Checking..." });

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "overview");
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    async function verifyHealth() {
      const status = await checkAiHealth();
      if (isMounted) {
        setAiHealth(status);
      }
    }
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="hotel-ai-container">
      {/* PAGE HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 6px 16px rgba(99, 102, 241, 0.35)",
            }}
          >
            <FaRobot />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: "var(--text-color, #0f172a)" }}>
                AI Modules
              </h1>
              <span className="ai-header-badge">
                Intelligence Suite
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted, #64748b)", fontSize: "13.5px" }}>
              Machine learning models & automated natural language processing for hotel management.
            </p>
          </div>
        </div>

        {/* AI BACKEND HEALTH STATUS BADGE */}
        <div
          className={`ai-status-badge ${aiHealth.online ? "online" : "offline"}`}
          title={aiHealth.message}
        >
          <span className={`ai-status-dot ${aiHealth.online ? "online" : "offline"}`} />
          <span style={{ fontSize: "12.5px", fontWeight: "700" }}>
            {aiHealth.online === null
              ? "Connecting..."
              : aiHealth.online
              ? "FastAPI ML Server Online (Port 8000)"
              : "FastAPI ML Server Offline (Check Port 8000)"}
          </span>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="hotel-ai-tabs-nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`hotel-ai-tab-btn ${isActive ? "active" : "inactive"}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div style={{ minHeight: "450px" }}>
        {activeTab === "overview" && (
          <CustomerDashboard
            aiHealth={aiHealth}
            onNavigate={(tab) => handleTabChange(tab)}
          />
        )}
        {activeTab === "sentiment" && <SentimentDashboard />}
        {activeTab === "revenue" && <RevenueDashboard />}
        {activeTab === "segmentation" && <CustomerSegmentation />}
        {activeTab === "cancellation" && <BookingCancellation />}
        {activeTab === "review-form" && (
          <ReviewForm onReviewAnalyzed={() => handleTabChange("sentiment")} />
        )}
      </div>

      {/* FLOATING AI ASSISTANT CHATBOT */}
      <Chatbot />
    </div>
  );
}
