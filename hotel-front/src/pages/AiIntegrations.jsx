import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { logAction } from "../audit.js";

// The AI services the hotel can plug in. Demo catalogue — connecting one only
// stores the config in memory, nothing is sent anywhere.
const CATALOG = [
  {
    key: "chat",
    name: "Guest Chat Assistant",
    icon: "💬",
    desc: "Answers guest questions on the booking page and takes reservation requests 24/7.",
  },
  {
    key: "pricing",
    name: "Smart Pricing",
    icon: "📈",
    desc: "Suggests room rates from occupancy, season and local demand.",
  },
  {
    key: "reviews",
    name: "Review Sentiment",
    icon: "⭐",
    desc: "Reads OTA reviews and flags recurring complaints per room and per staff shift.",
  },
  {
    key: "forecast",
    name: "Demand Forecasting",
    icon: "🔮",
    desc: "Predicts next month's occupancy so housekeeping and stock can be planned.",
  },
  {
    key: "housekeeping",
    name: "Housekeeping Auto-Scheduler",
    icon: "🧹",
    desc: "Builds the daily cleaning roster from check-outs, room status and staff on duty.",
  },
  {
    key: "replies",
    name: "Email & Reply Drafting",
    icon: "✉️",
    desc: "Drafts replies to enquiries, complaints and review responses for staff to approve.",
  },
];

const MODELS = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 — most capable" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5 — balanced" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 — fastest" },
];

const DEFAULT_MODEL = MODELS[0].id;

// Never keep the typed key around — store only what is safe to show back.
function maskKey(key) {
  const tail = key.trim().slice(-4);
  return tail ? `••••••••${tail}` : "••••••••";
}

export default function AiIntegrations() {
  // key -> { model, masked, enabled }. Absent = not connected.
  const [connections, setConnections] = useState({});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ apiKey: "", model: DEFAULT_MODEL });

  const connectedCount = Object.keys(connections).length;
  const activeCount = Object.values(connections).filter((c) => c.enabled).length;

  function openForm(item) {
    const existing = connections[item.key];
    setDraft({ apiKey: "", model: existing ? existing.model : DEFAULT_MODEL });
    setEditing(item.key);
  }

  function save(item) {
    const existing = connections[item.key];
    // On re-configure an empty key means "keep the key you already have".
    if (!existing && !draft.apiKey.trim()) return;
    setConnections((c) => ({
      ...c,
      [item.key]: {
        model: draft.model,
        masked: draft.apiKey.trim() ? maskKey(draft.apiKey) : existing.masked,
        enabled: existing ? existing.enabled : true,
      },
    }));
    logAction(
      `${existing ? "Updated" : "Connected"} AI integration "${item.name}" (${draft.model})`,
      "AI Integrations"
    );
    setDraft({ apiKey: "", model: DEFAULT_MODEL });
    setEditing(null);
  }

  function disconnect(item) {
    setConnections((c) => {
      const next = { ...c };
      delete next[item.key];
      return next;
    });
    logAction(`Disconnected AI integration "${item.name}"`, "AI Integrations");
    if (editing === item.key) setEditing(null);
  }

  function toggle(item) {
    setConnections((c) => {
      if (!c[item.key]) return c;
      return { ...c, [item.key]: { ...c[item.key], enabled: !c[item.key].enabled } };
    });
    logAction(
      `${connections[item.key].enabled ? "Paused" : "Resumed"} AI integration "${item.name}"`,
      "AI Integrations"
    );
  }

  return (
    <>
      <PageHeader
        title="AI Integrations"
        subtitle="Connect and manage the AI services used across the hotel (Super Admin only)"
      />

      <div className="stats">
        <div className="stat-card">
          <span className="dot" style={{ background: "#805ad5" }} />
          <div>
            <div className="stat-value">{CATALOG.length}</div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="dot" style={{ background: "#38a169" }} />
          <div>
            <div className="stat-value">{connectedCount}</div>
            <div className="stat-label">Connected</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="dot" style={{ background: "#3182ce" }} />
          <div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
      </div>

      <section className="panel">
        <h2>Integrations</h2>
        <div className="ai-grid">
          {CATALOG.map((item) => {
            const conn = connections[item.key];
            const isEditing = editing === item.key;
            return (
              <div key={item.key} className={"ai-card" + (conn ? " connected" : "")}>
                <div className="ai-card-head">
                  <span className="ai-ic">{item.icon}</span>
                  <div className="ai-card-title">
                    <h3>{item.name}</h3>
                    <span className={"badge " + (conn ? (conn.enabled ? "active" : "pending") : "checkedout")}>
                      {conn ? (conn.enabled ? "Active" : "Paused") : "Not connected"}
                    </span>
                  </div>
                </div>

                <p className="ai-desc">{item.desc}</p>

                {conn && !isEditing && (
                  <dl className="ai-meta">
                    <div>
                      <dt>Model</dt>
                      <dd>{conn.model}</dd>
                    </div>
                    <div>
                      <dt>API key</dt>
                      <dd>{conn.masked}</dd>
                    </div>
                  </dl>
                )}

                {isEditing ? (
                  <div className="ai-form">
                    <label className="ai-field">
                      <span>API key</span>
                      <input
                        type="password"
                        autoComplete="off"
                        placeholder={conn ? "Leave blank to keep current key" : "sk-..."}
                        value={draft.apiKey}
                        onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                      />
                    </label>
                    <label className="ai-field">
                      <span>Model</span>
                      <select
                        value={draft.model}
                        onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                      >
                        {MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="ai-actions">
                      <button
                        className="btn-sm"
                        disabled={!conn && !draft.apiKey.trim()}
                        onClick={() => save(item)}
                      >
                        Save
                      </button>
                      <button className="btn-sm" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ai-actions">
                    <button className="btn-sm" onClick={() => openForm(item)}>
                      {conn ? "Configure" : "Connect"}
                    </button>
                    {conn && (
                      <>
                        <button className="btn-sm" onClick={() => toggle(item)}>
                          {conn.enabled ? "Pause" : "Resume"}
                        </button>
                        <button className="btn-sm danger" onClick={() => disconnect(item)}>
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
       
      </section>
    </>
  );
}
