import { getCurrentOrgId, getAuthHeaders } from "../../auth.js";

const API_BASE = "http://localhost:4000/api/ota";

// Legacy object with stubs to prevent synchronous crashes in components that haven't been updated to async yet.
// No dummy data or localStorage caching is used.
export const otaStorage = {
  getConnections: () => [],
  saveConnections: () => { console.warn("saveConnections deprecated. Use API methods."); },

  getRooms: () => [],
  saveRooms: () => { console.warn("saveRooms deprecated. Use API methods."); },

  getBookings: () => [],
  saveBookings: () => { console.warn("saveBookings deprecated. Use API methods."); },

  getRoomMappings: () => [],
  saveRoomMappings: () => { console.warn("saveRoomMappings deprecated. Use API methods."); },

  getRateMappings: () => [],
  saveRateMappings: () => { console.warn("saveRateMappings deprecated. Use API methods."); },

  getSyncHistory: () => [],
  saveSyncHistory: () => { console.warn("saveSyncHistory deprecated. Use API methods."); },

  getSettings: () => ({ autoSync: true, globalInterval: 15, failureRate: 0.1 }),
  saveSettings: () => { console.warn("saveSettings deprecated. Use API methods."); },

  clearAll: () => { 
    console.warn("clearAll deprecated. Manage data via backend."); 
    return { connections: [], rooms: [], bookings: [], roomMaps: [], rateMaps: [], syncLogs: [] };
  },
};

// ----------------------------------------------------
// ASYNC API WRAPPERS
// ----------------------------------------------------

export async function fetchOtaConnections() {
  const orgId = getCurrentOrgId();
  const res = await fetch(`${API_BASE}/connections?orgId=${encodeURIComponent(orgId)}`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (res.ok && data.connections) return data.connections;
  throw new Error(data.error || "Failed to fetch OTA connections");
}

export async function saveOtaConnection(connectionData) {
  const orgId = getCurrentOrgId();
  const res = await fetch(`${API_BASE}/connections`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...connectionData, orgId }),
  });
  const data = await res.json();
  if (res.ok && data.connection) return data.connection;
  throw new Error(data.error || "Failed to save OTA connection");
}

export async function fetchOtaBookings() {
  const orgId = getCurrentOrgId();
  const res = await fetch(`${API_BASE}/bookings?orgId=${encodeURIComponent(orgId)}`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (res.ok && data.bookings) return data.bookings;
  throw new Error(data.error || "Failed to fetch OTA bookings");
}
