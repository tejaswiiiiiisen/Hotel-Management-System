import React, { useRef, useState } from "react";
import {
  Send,
  Trash2,
  X,
  Sparkles,
  Bot,
  Hotel,
  Users,
  CalendarCheck,
  Star,
  BedDouble,
  UserRound,
  TrendingUp,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { sendChatMessage } from "../../services/aiService.js";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I'm your Hotel AI Assistant. How can I assist you with guest operations, forecasting, or analytics today?",
    },
  ]);

  const [position, setPosition] = useState(null);

  const drag = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });

  const suggestions = [
    {
      text: "How many active bookings are there?",
      icon: CalendarCheck,
      label: "Bookings",
    },
    {
      text: "Show VIP customer segment statistics",
      icon: Users,
      label: "Customers",
    },
    {
      text: "Summarize guest sentiment ratings",
      icon: Star,
      label: "Reviews",
    },
    {
      text: "What is next month's predicted revenue?",
      icon: TrendingUp,
      label: "Revenue",
    },
  ];

  const handleDelete = () => {
    setMessages([]);
  };

  const sendMessage = async (text = message) => {
    const value = text.trim();
    if (!value || isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text: value,
      },
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(value);
      const botReply =
        result.message ||
        result.response ||
        result.answer ||
        result.reply ||
        "I've processed your hotel query. Check the dedicated AI tabs above for deeper model insights.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: botReply,
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "I am ready to assist with all hotel management analytics.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startDrag = (e) => {
    if (e.button !== 0) return;
    const box = e.currentTarget.closest(".hotel-chatbot");
    if (!box) return;

    const rect = box.getBoundingClientRect();
    drag.current = {
      active: true,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  const moveDrag = (e) => {
    if (!drag.current.active) return;
    const boxWidth = 400;
    const boxHeight = 600;

    const x = Math.max(10, Math.min(e.clientX - drag.current.offsetX, window.innerWidth - boxWidth - 10));
    const y = Math.max(10, Math.min(e.clientY - drag.current.offsetY, window.innerHeight - boxHeight - 10));

    setPosition({ x, y });
  };

  const stopDrag = () => {
    drag.current.active = false;
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", moveDrag);
    window.removeEventListener("mouseup", stopDrag);
  };

  const chatbotStyle = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: "auto",
        bottom: "auto",
      }
    : {};

  return (
    <>
      {/* FLOATING ROBOT BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Hotel AI Assistant"
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 9999,
            width: "66px",
            height: "66px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4f46e5 100%)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 12px 30px rgba(79, 70, 229, 0.4)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px) scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0) scale(1)")}
        >
          <Bot size={30} strokeWidth={1.8} />
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#10b981",
              border: "2px solid #0f172a",
              boxShadow: "0 0 8px #10b981",
            }}
          />
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          style={{
            ...chatbotStyle,
            position: position ? "fixed" : "fixed",
            bottom: position ? undefined : "24px",
            right: position ? undefined : "24px",
            zIndex: 9999,
            width: "390px",
            height: "620px",
            maxHeight: "calc(100vh - 40px)",
            maxWidth: "calc(100vw - 32px)",
            display: "flex",
            flexDirection: "column",
            borderRadius: "24px",
            overflow: "hidden",
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.3)",
          }}
          className="hotel-chatbot"
        >
          {/* HEADER */}
          <div
            onMouseDown={startDrag}
            style={{
              cursor: "move",
              background: "linear-gradient(135deg, #020617 0%, #1e1b4b 60%, #3730a3 100%)",
              padding: "16px 20px",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>Hotel AI Agent</h3>
                  <span style={{ fontSize: "9px", background: "rgba(99, 102, 241, 0.3)", color: "#a5b4fc", padding: "2px 6px", borderRadius: "999px", fontWeight: "700" }}>
                    ONLINE
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Assistant for Operations & Analytics</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleDelete}
                title="Clear conversation"
                style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#ffffff", padding: "6px", borderRadius: "8px", cursor: "pointer" }}
              >
                <Trash2 size={14} />
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#ffffff", padding: "6px", borderRadius: "8px", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* CHAT BODY */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "var(--bg-secondary, #f8fafc)",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.sender === "user" ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "var(--card-bg, #ffffff)",
                  color: msg.sender === "user" ? "#ffffff" : "var(--text-color, #1e293b)",
                  border: msg.sender === "user" ? "none" : "1px solid var(--border-color, #e2e8f0)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                {msg.text}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 14px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "var(--card-bg, #ffffff)",
                  color: "#64748b",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Sparkles size={14} className="animate-spin" /> Analyzing hotel database...
              </div>
            )}

            {/* QUICK SUGGESTIONS */}
            {messages.length <= 1 && !isLoading && (
              <div style={{ marginTop: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Suggested Inquiries
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "8px" }}>
                  {suggestions.map((s) => (
                    <button
                      key={s.text}
                      type="button"
                      onClick={() => sendMessage(s.text)}
                      className="hotel-ai-card"
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "var(--text-color, #334155)",
                      }}
                    >
                      <span>{s.text}</span>
                      <ChevronRight size={13} color="var(--text-muted, #94a3b8)" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* INPUT BAR */}
          <div style={{ padding: "12px", background: "var(--card-bg, #ffffff)", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask Hotel AI anything..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  background: "var(--input-bg, #f8fafc)",
                  color: "var(--text-color, #0f172a)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!message.trim() || isLoading}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: !message.trim() || isLoading ? "not-allowed" : "pointer",
                  opacity: !message.trim() || isLoading ? 0.6 : 1,
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
