/**
 * Booking API Service — centralised API calls for booking management.
 * Used by RoomManagement, RoomDetails, BookRoomModal, and other components
 * to sync bookings with the MySQL backend.
 */
import { getCurrentOrgId } from "../auth.js";

const API_BASE = "http://localhost:4000/api";

/**
 * Fetch all bookings (for dashboard / Super Admin).
 * Optional filters: { status, roomId, source }
 */
export async function fetchAllBookings(filters = {}) {
  try {
    const orgId = filters.orgId || getCurrentOrgId() || "";
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.roomId) params.set("roomId", String(filters.roomId));
    if (filters.source) params.set("source", filters.source);
    if (orgId) params.set("orgId", String(orgId));
    const qs = params.toString();
    const res = await fetch(`${API_BASE}/bookings${qs ? `?${qs}` : ""}`, {
      headers: {
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`,
        "x-org-id": orgId
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.bookings || [];
  } catch (err) {
    console.warn("fetchAllBookings API failed:", err);
    return null;
  }
}

/**
 * Fetch bookings for a specific room.
 */
export async function fetchBookingsForRoom(roomId) {
  return fetchAllBookings({ roomId });
}

/**
 * Fetch complete room history by room UID, ID, or room number.
 */
export async function fetchRoomHistory(identifier) {
  if (!identifier) return [];
  try {
    const orgId = getCurrentOrgId() || "";
    const res = await fetch(`${API_BASE}/bookings/room-history/${encodeURIComponent(identifier)}`, {
      headers: {
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`,
        "x-org-id": orgId
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.bookings || [];
  } catch (err) {
    console.warn("fetchRoomHistory API failed:", err);
    return [];
  }
}

/**
 * Fetch a single booking by ID or booking code.
 */
export async function fetchBookingById(id) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      headers: {
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`,
        "x-org-id": sessionStorage.getItem("currentOrgId") || ""
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.booking || null;
  } catch (err) {
    console.warn("fetchBookingById API failed:", err);
    return null;
  }
}

/**
 * Create a new booking. Handles both website and dashboard-originated bookings.
 * The backend will automatically mark the room as Occupied if roomId is provided.
 */
export async function createBookingAPI(bookingData) {
  try {
    const orgId = sessionStorage.getItem("currentOrgId") || localStorage.getItem("currentOrgId") || "";
    const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
    const headers = { 
      "Content-Type": "application/json",
      "x-org-id": orgId
    };
    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ ...bookingData, orgId: bookingData.orgId || orgId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error || data.message || `Server error (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.warn("createBookingAPI failed:", err);
    throw err;
  }
}

/**
 * Check-out a booking. Resets the room to Available.
 */
export async function checkoutBookingAPI(bookingId) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/checkout`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`,
        "x-org-id": sessionStorage.getItem("currentOrgId") || ""
      },
      credentials: "include",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    const result = await res.json();

    // Trigger state machine: automatically create Dirty / Needs Cleaning turnover task
    try {
      const { addHkTask } = await import("./housekeepingStore.js");
      const roomNumber = result?.booking?.roomNumber || result?.booking?.room_number || "Room";
      const floor = result?.booking?.floor || "1st Floor";
      addHkTask({
        room: `Room ${roomNumber.replace(/^Room\s*/i, "")}`,
        floor: floor,
        cleaningType: "Check-Out Turnover",
        task: "Guest Check-Out Turnover & Sanitize",
        priority: "Urgent (VIP)",
        status: "Dirty",
      });
    } catch (e) {
      console.warn("Auto-create HK turnover task skipped:", e);
    }

    return result;
  } catch (err) {
    console.warn("checkoutBookingAPI failed:", err);
    throw err;
  }
}

/**
 * Check-in a booking. Marks room as Occupied and booking as Active Stay.
 */
export async function checkinBookingAPI(bookingId) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/checkin`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`,
        "x-org-id": sessionStorage.getItem("currentOrgId") || ""
      },
      credentials: "include",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("checkinBookingAPI failed:", err);
    throw err;
  }
}

/**
 * Cancel a booking. Resets the room to Available.
 */
export async function cancelBookingAPI(bookingId) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`,
        "x-org-id": sessionStorage.getItem("currentOrgId") || ""
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("cancelBookingAPI failed:", err);
    return null;
  }
}
