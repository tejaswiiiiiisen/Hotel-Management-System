import { useState } from "react";
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaShieldAlt, FaSpinner } from "react-icons/fa";
import { otaService } from "../../services/ota/otaService.js";

const AVAILABLE_CHANNELS = [
  { id: "booking_com", name: "Booking.com", defaultProp: "PROP-BK-8821" },
  { id: "makemytrip", name: "MakeMyTrip", defaultProp: "PROP-MMT-4412" },
  { id: "goibibo", name: "Goibibo", defaultProp: "PROP-GOI-9931" },
  { id: "agoda", name: "Agoda", defaultProp: "PROP-AGO-1294" },
  { id: "airbnb", name: "Airbnb", defaultProp: "PROP-AB-7740" },
  { id: "expedia", name: "Expedia Group", defaultProp: "PROP-EXP-6620" },
];

export default function OTAConnectionModal({ isOpen, onClose, onSuccess }) {
  const [selectedChannelId, setSelectedChannelId] = useState("booking_com");
  const [propertyId, setPropertyId] = useState("PROP-BK-8821");
  const [apiKey, setApiKey] = useState("demo_key_99381");
  const [apiSecret, setApiSecret] = useState("••••••••••••••");
  const [autoSync, setAutoSync] = useState(true);

  const [testState, setTestState] = useState({ loading: false, success: null, message: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleChannelSelect = (id) => {
    setSelectedChannelId(id);
    const item = AVAILABLE_CHANNELS.find((c) => c.id === id);
    if (item) setPropertyId(item.defaultProp);
    setTestState({ loading: false, success: null, message: "" });
    setErrorMsg("");
  };

  const handleTestConnection = async () => {
    setTestState({ loading: true, success: null, message: "Connecting to OTA handshake endpoint..." });
    setErrorMsg("");
    try {
      await otaService.testConnection(selectedChannelId, propertyId, apiKey, apiSecret);
      setTestState({
        loading: false,
        success: true,
        message: "✓ Connection test successful! OTA API endpoint reached.",
      });
    } catch (err) {
      setTestState({
        loading: false,
        success: false,
        message: err.message || "Unable to connect to OTA.",
      });
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!propertyId.trim()) {
      setErrorMsg("Property ID is required.");
      return;
    }
    if (!apiKey.trim()) {
      setErrorMsg("Demo API Key is required.");
      return;
    }

    setSubmitLoading(true);
    try {
      const selectedItem = AVAILABLE_CHANNELS.find((c) => c.id === selectedChannelId);
      await otaService.connectChannel({
        channelId: selectedChannelId,
        displayName: selectedItem?.name || selectedChannelId,
        propertyId,
        apiKey,
        apiSecret,
        autoSync,
      });

      setSubmitLoading(false);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setSubmitLoading(false);
      setErrorMsg(err.message || "Failed to connect OTA channel.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        className="ota-modal-card"
        style={{
          borderRadius: "20px",
          width: "100%",
          maxWidth: "520px",
          padding: "24px 28px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
            Connect New OTA Channel
          </h2>
          <button
            type="button"
            className="ota-modal-close-btn"
            onClick={onClose}
            style={{
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* SECURITY NOTICE */}
        <div
          className="ota-modal-alert-notice"
          style={{
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "20px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaShieldAlt style={{ fontSize: "16px", flexShrink: 0, color: "#3b82f6" }} />
          <span>
            <strong>Demo mode:</strong> OTA credentials are simulated. Real OTA credentials should be securely handled by a backend service.
          </span>
        </div>

        {/* FORM */}
        <form onSubmit={handleConnect}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* SELECT CHANNEL */}
            <div>
              <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                Select OTA Channel
              </label>
              <select
                value={selectedChannelId}
                onChange={(e) => handleChannelSelect(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                {AVAILABLE_CHANNELS.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PROPERTY ID */}
            <div>
              <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                Property ID
              </label>
              <input
                type="text"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                placeholder="e.g. PROP-BK-8821"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {/* DEMO API KEY & SECRET */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                  Demo API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="demo_key_..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                  Demo API Secret
                </label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="••••••••••"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* AUTO SYNC CHECKBOX */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
              <input
                type="checkbox"
                id="autoSyncCheck"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label htmlFor="autoSyncCheck" className="ota-modal-label" style={{ fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                Enable Automatic 2-Way Synchronization
              </label>
            </div>

            {/* ERROR MSG */}
            {errorMsg && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaExclamationCircle /> {errorMsg}
              </div>
            )}

            {/* TEST STATUS FEEDBACK */}
            {testState.loading && (
              <div style={{ fontSize: "12px", color: "#2563eb", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaSpinner className="spin-icon" /> {testState.message}
              </div>
            )}
            {testState.success === true && (
              <div style={{ fontSize: "12px", color: "#16a34a", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaCheckCircle /> {testState.message}
              </div>
            )}
            {testState.success === false && (
              <div style={{ fontSize: "12px", color: "#dc2626", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaExclamationCircle /> {testState.message}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div
            className="ota-modal-footer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "24px",
              paddingTop: "16px",
            }}
          >
            <button
              type="button"
              className="ota-modal-cancel-btn"
              onClick={onClose}
              style={{
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="ota-modal-sec-btn"
              onClick={handleTestConnection}
              disabled={testState.loading || submitLoading}
              style={{
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {testState.loading ? "Testing..." : "Test Connection"}
            </button>

            <button
              type="submit"
              disabled={submitLoading}
              style={{
                padding: "9px 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                border: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
              }}
            >
              {submitLoading ? "Connecting..." : "Connect Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
