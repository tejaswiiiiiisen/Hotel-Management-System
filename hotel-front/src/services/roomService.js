/**
 * Room API Service — centralised API calls for room management.
 * Falls back gracefully if the backend is unreachable.
 */
import { getCurrentOrgId } from "../auth.js";

const API_BASE = "http://localhost:4000/api";

export async function fetchRooms(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.availableOnly) params.set("availableOnly", "true");
    if (filters.orgId) params.set("orgId", filters.orgId);
    if (filters.org) params.set("org", filters.org);
    
    const orgId = getCurrentOrgId();
    if (orgId && !filters.orgId) params.set("orgId", orgId);

    const qs = params.toString();
    const res = await fetch(`${API_BASE}/rooms${qs ? `?${qs}` : ""}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.allRooms || data.rooms || []);

  } catch (err) {
    console.warn("fetchRooms API failed, falling back to localStorage:", err);
    return null; // caller should fallback to localStorage
  }
}

export async function fetchRoomStatusSummary() {
  try {
    const orgId = getCurrentOrgId();
    const qs = orgId ? `?orgId=${orgId}` : "";
    const res = await fetch(`${API_BASE}/rooms/status-summary${qs}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchRoomStatusSummary API failed:", err);
    return null;
  }
}

function getAuthHeader() {
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createRoomAPI(roomData) {
  try {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      credentials: "include",
      body: JSON.stringify(roomData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("createRoomAPI failed:", err);
    return null;
  }
}

export async function updateRoomAPI(id, roomData) {
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      credentials: "include",
      body: JSON.stringify(roomData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("updateRoomAPI failed:", err);
    return null;
  }
}

export async function deleteRoomAPI(id) {
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeader(),
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("deleteRoomAPI failed:", err);
    return null;
  }
}
