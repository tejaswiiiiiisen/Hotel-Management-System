import { showSuccess, showError, showWarning, showInfo } from "../../utils/toast.js";
import { useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaSyncAlt, FaClock } from "react-icons/fa";
import { getRelativeTimeString } from "../../utils/otaTime.js";
import { otaService } from "../../services/ota/otaService.js";

export default function OTASyncHistory({ syncHistory = [], connections = [], onRefresh }) {
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [retryingId, setRetryingId] = useState(null);

  const handleRetrySync = async (log) => {
    setRetryingId(log.id);
    try {
      await otaService.syncChannel(log.otaChannelId, false);
      setRetryingId(null);
      onRefresh && onRefresh();
    } catch (err) {
      setRetryingId(null);
      showError(err.message || "Retry failed.");
    }
  };

  const filteredLogs = syncHistory.filter((log) => {
    const matchesChannel = channelFilter === "ALL" || log.otaChannelId === channelFilter;
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    return matchesChannel && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* TOOLBAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h3 className="ota-section-title" style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>
          Real-Time Sync Audit History
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            className="ota-filter-select"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          >
            <option value="ALL">All OTA Channels</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName || c.name}
              </option>
            ))}
          </select>

          <select
            className="ota-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* HISTORY TABLE WITH SINGLE LINE ROWS & PROJECT FONT */}
      <div className="ota-table-wrapper" style={{ overflowX: "auto", borderRadius: "14px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", whiteSpace: "nowrap" }}>
          <thead>
            <tr className="ota-table-header" style={{ textAlign: "left" }}>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>DATE / TIME</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>OTA CHANNEL</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>SYNC TYPE</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>STATUS</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>ROOMS / RATES</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>DETAILS / ERROR</th>
              <th style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                  No sync audit records match the selected filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="ota-table-row">
                  <td style={{ padding: "12px 16px", fontSize: "12px", whiteSpace: "nowrap" }}>
                    <FaClock style={{ marginRight: "4px", fontSize: "10px", opacity: 0.7 }} />
                    {getRelativeTimeString(log.timestamp)}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "700", whiteSpace: "nowrap" }}>
                    {log.otaChannelName}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", whiteSpace: "nowrap" }}>
                    {log.type}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: log.status === "SUCCESS" ? "#dcfce7" : "#fee2e2",
                        color: log.status === "SUCCESS" ? "#16a34a" : "#dc2626",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {log.status === "SUCCESS" ? <FaCheckCircle /> : <FaExclamationCircle />}
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {log.roomsUpdated} rooms • {log.ratesUpdated} rates ({log.durationMs}ms)
                  </td>
                  <td style={{ padding: "12px 16px", color: log.status === "FAILED" ? "#dc2626" : "inherit", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {log.message}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {log.status === "FAILED" && (
                      <button
                        type="button"
                        className="ota-cancel-btn"
                        onClick={() => handleRetrySync(log)}
                        disabled={retryingId === log.id}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FaSyncAlt className={retryingId === log.id ? "spin-icon" : ""} />
                        {retryingId === log.id ? "Retrying..." : "Retry"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
