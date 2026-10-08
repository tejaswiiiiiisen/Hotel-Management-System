import { showSuccess, showError, showWarning, showInfo } from "./toast.js";
import { logAction } from "../audit.js";
import { getCurrentOrg, getCurrentOrgId, getScopedStorageKey } from "../auth.js";
import { fetchRooms as fetchRoomsAPI, createRoomAPI, deleteRoomAPI } from "../services/roomService.js";
import { createBookingAPI, checkoutBookingAPI, checkinBookingAPI } from "../services/bookingService.js";
import { addNotification } from "../services/notificationStore.js";
import { addHkTask } from "../services/housekeepingStore.js";

const API_BASE_URL = "http://localhost:4000";
const API_BASE = "http://localhost:4000/api/rooms";

// Stub for legacy synchronous calls
export const INITIAL_ROOMS = [];

function getStorageKey() {
  return getScopedStorageKey("rooms");
}



const FALLBACK_ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
];

export function deriveFloorFromNumber(numStr) {
  const str = String(numStr || "").trim();
  if (!str) return "1st Floor";
  const firstChar = str.charAt(0);
  const suffixes = { "1": "1st Floor", "2": "2nd Floor", "3": "3rd Floor", "4": "4th Floor", "5": "5th Floor", "6": "6th Floor", "7": "7th Floor", "8": "8th Floor", "9": "9th Floor", "10": "10th Floor" };
  return suffixes[firstChar] || `${firstChar}th Floor`;
}

export function formatRoomForAdmin(r, idx = 0) {
  let num = r.roomNumber || r.number || String(r.id);

  const computedFloor = r.floor || deriveFloorFromNumber(num);

  let rawImg = Array.isArray(r.images) && r.images[0] ? r.images[0] : r.image;
  if (!rawImg || typeof rawImg !== "string" || !rawImg.startsWith("http")) {
    const imgKey = String(r.id || num || "1").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    rawImg = FALLBACK_ROOM_IMAGES[imgKey % FALLBACK_ROOM_IMAGES.length];
  }

  const isPopular = Boolean(r.isPopular || r.badge === "Popular" || (r.rating && r.rating >= 4.5));
  const badge = r.badge || (isPopular ? "Popular" : null);

  const formattedType = r.type || "Standard";
  const formattedTitle = r.name 
    ? r.name 
    : `Room ${num} - ${formattedType} ${formattedType.toLowerCase().includes("room") || formattedType.toLowerCase().includes("suite") ? "" : "Room"}`.trim();

  const priceNum = Number(r.pricePerNight || r.price || 2500);
  const capacityNum = Number(r.capacity || r.guests || 2);
  const statusStr = r.available === false ? "Occupied" : (r.status || "Available");
  const availableBool = r.available !== undefined ? Boolean(r.available) : statusStr !== "Occupied";

  return {
    id: r.id,
    number: String(num),
    roomNumber: String(num),
    room_number: String(num),
    name: formattedTitle,
    type: formattedType,
    roomType: formattedType,
    room_type: formattedType,
    price: priceNum,
    pricePerNight: priceNum,
    price_per_night: priceNum,
    status: statusStr,
    available: availableBool,
    floor: computedFloor,
    guests: capacityNum,
    capacity: capacityNum,
    maxGuests: capacityNum,
    max_guests: capacityNum,
    beds: r.beds || "1 King Bed",
    sizeSqm: r.sizeSqm || 28,
    shortDescription: r.shortDescription || r.short_description || `Executive ${formattedType} on ${computedFloor}.`,
    roomView: r.roomView || r.room_view || "Garden View",
    badge,
    isPopular,
    image: rawImg,
    images: r.images || [rawImg],
    amenities: r.amenities || [
      "WiFi",
      "Air conditioning",
      "Minibar",
      "TV",
    ],
  };
}

// Ensure the helper normaliseAPIRoom is updated to not conflict or just reuse formatRoomForAdmin
export function normaliseAPIRoom(apiRoom) {
  return formatRoomForAdmin(apiRoom);
}

export async function fetchRoomsFromApi() {
  const currentOrgId = getCurrentOrgId();
  const currentOrg = getCurrentOrg();
  const queryParam = currentOrgId ? `orgId=${encodeURIComponent(currentOrgId)}` : (currentOrg ? `org=${encodeURIComponent(currentOrg)}` : "");
  const url = queryParam ? `${API_BASE}?${queryParam}` : API_BASE;
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  const res = await fetch(url, { 
    headers: { Authorization: token ? `Bearer ${token}` : "" }
  });
  
  if (res.ok) {
    const data = await res.json();
    const rawList = Array.isArray(data) ? data : (data.allRooms || data.rooms || []);
    return rawList.map((r, idx) => formatRoomForAdmin(r, idx));
  }
  
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Failed to fetch rooms from API");
}

export async function fetchRoomsFromAPI() {
  return fetchRoomsFromApi();
}

export async function addRoomToApi(roomData) {
  const imagesArr = Array.isArray(roomData.images) && roomData.images.length > 0
    ? roomData.images
    : [roomData.image || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"];

  const amenitiesArr = Array.isArray(roomData.amenities) && roomData.amenities.length > 0
    ? roomData.amenities
    : ["Free Wi-Fi", "Air Conditioning", "TV"];

  const roomName = roomData.name || `Room ${roomData.number || ""} - ${roomData.type || "Standard"}`;

  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: "include",
    body: JSON.stringify({
      name: roomName,
      type: roomData.type || "Standard",
      roomNumber: String(roomData.number || roomData.roomNumber || ""),
      floor: roomData.floor || "1st Floor",
      roomView: roomData.roomView || "Garden View",
      badge: roomData.badge !== undefined && roomData.badge !== "" ? roomData.badge : (roomData.isPopular ? "Popular" : null),
      isPopular: Boolean(roomData.isPopular),
      shortDescription: roomData.shortDescription || `Executive ${roomData.type || "Standard"} room on ${roomData.floor || "1st Floor"}.`,
      description: roomData.description || "Enjoy a luxurious stay with premium furnishings and scenic views.",
      pricePerNight: Number(roomData.price || roomData.pricePerNight || 2500),
      capacity: Number(roomData.guests || roomData.capacity || 2),
      guests: Number(roomData.guests || roomData.capacity || 2),
      sizeSqm: Number(roomData.sizeSqm || 35),
      beds: roomData.beds || "1 King Bed",
      images: imagesArr,
      amenities: amenitiesArr,
      status: roomData.status || "Available",
      available: roomData.status === "Occupied" ? false : true,
      orgId: getCurrentOrgId() || undefined,
      org: getCurrentOrg() || "Matcha Tea",
    }),
  });
  
  if (res.ok) {
    return await fetchRoomsFromApi();
  }
  
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Failed to add room to database.");
}

export const createRoomInApi = addRoomToApi;



// ── localStorage helpers (kept as fallback) ─────────────────────────────────

export function getRooms() {
  try {
    const key = getStorageKey();
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load rooms from localStorage", e);
  }
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(INITIAL_ROOMS));
  return INITIAL_ROOMS;
}

export function saveRooms(rooms) {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(rooms));
  } catch (e) {
    console.error("Failed to save rooms to localStorage", e);
  }
}


// ── API-first wrappers ──────────────────────────────────────────────────────


/**
 * Fetch rooms from the API, normalise them, cache in localStorage.
 * Returns null if the API is unreachable (caller should fallback to getRooms).
 */


/**
 * Create a room via the API. Falls back to localStorage if API is down.
 */
export async function addRoomWithAPI(roomData) {
  const apiResult = await createRoomAPI({
    name: `Room ${roomData.number}`,
    type: roomData.type || "Standard",
    roomNumber: roomData.number,
    floor: roomData.floor,
    pricePerNight: Number(roomData.price),
    capacity: roomData.guests || 2,
    beds: roomData.beds || "1 King Bed",
  });

  if (apiResult && apiResult.room) {
    return await fetchRoomsFromAPI();
  }
  throw new Error("Failed to add room via API.");
}

export async function updateRoomInApi(roomId, roomData) {
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  const res = await fetch(`${API_BASE}/${roomId}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(roomData),
  });
  
  if (res.ok) {
    return await fetchRoomsFromApi();
  }
  
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Failed to update room in API");
}

export async function deleteRoomFromApi(roomId) {
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  const res = await fetch(`${API_BASE}/${roomId}`, { 
    method: "DELETE", 
    headers: { Authorization: token ? `Bearer ${token}` : "" }
  });
  
  if (res.ok) {
    return await fetchRoomsFromApi();
  }
  
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Failed to delete room from API");
}

export const deleteRoomInApi = deleteRoomFromApi;

export async function deleteRoomWithAPI(roomId) {
  const apiResult = await deleteRoomAPI(roomId);
  if (!apiResult) throw new Error("Failed to delete room from server.");
  return await fetchRoomsFromAPI();
}

export async function bookRoomWithAPI(room, bookingData, staffName) {
  const apiResult = await createBookingAPI({
    roomId: room.id,
    roomName: room.name || `Room ${room.number}`,
    roomNumber: room.number,
    floor: room.floor,
    roomView: room.roomView || "Standard View",
    checkInDate: bookingData.checkIn,
    checkOutDate: bookingData.checkOut,
    nights: bookingData.nights || 1,
    days: bookingData.days || 2,
    guests: `${bookingData.guests || 2} Adults`,
    amountPaid: bookingData.totalBill || bookingData.paidAmount || 0,
    nightlyRate: bookingData.roomPrice || room.price || 0,
    paymentMethod: bookingData.paymentMethod || "Credit Card",
    image: room.image || "",
    amenities: room.amenities || [],
    guestName: bookingData.guestName,
    guestPhone: bookingData.phone || "",
    guestEmail: bookingData.email || "",
    source: "dashboard",
    bookedBy: staffName || "Staff",
  });

  if (apiResult) {
    return await fetchRoomsFromAPI();
  }
  throw new Error("Failed to book room via API");
}

export async function cancelBookingWithAPI(roomId, bookingPkId) {
  if (bookingPkId) {
    await checkoutBookingAPI(bookingPkId);
  } else {
    // If we only have roomId, try to update status directly
    await updateRoomInApi(roomId, { status: "Available" });
  }
  return await fetchRoomsFromAPI();
}

export async function checkinBookingWithAPI(roomId, bookingPkId) {
  if (bookingPkId) {
    await checkinBookingAPI(bookingPkId);
  }
  return await fetchRoomsFromAPI();
}

export function getFloorNumber(floorStr) {
  if (!floorStr) return 1;
  const match = String(floorStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export function getFloorRoomPool(floorStr, count = 25) {
  const floorNum = getFloorNumber(floorStr);
  const pool = [];
  const base = floorNum * 100;
  for (let i = 1; i <= count; i++) {
    const num = base + i;
    pool.push(String(num));
  }
  return pool;
}

export function getAvailableRoomNumbers(roomsList = [], floorStr = "1st Floor", editingRoomId = null, currentOrgId = null, configuredNumbers = null) {
  const targetOrgId = currentOrgId || getCurrentOrgId();

  const branchRooms = (Array.isArray(roomsList) ? roomsList : []).filter((r) => {
    if (!r) return false;
    const rFloor = r.floor || deriveFloorFromNumber(r.roomNumber || r.number);
    if (String(rFloor).toLowerCase().trim() !== String(floorStr).toLowerCase().trim()) return false;

    if (targetOrgId) {
      const rOrg = r.orgId || r.org_id;
      if (rOrg && String(rOrg).trim() !== String(targetOrgId).trim()) return false;
    }
    return true;
  });

  const usedNumbers = new Set();
  let currentEditingRoomNumber = null;

  branchRooms.forEach((r) => {
    const num = String(r.roomNumber || r.number || r.room_number || "").trim();
    if (!num) return;
    if (editingRoomId && String(r.id) === String(editingRoomId)) {
      currentEditingRoomNumber = num;
    } else {
      usedNumbers.add(num);
    }
  });

  let basePool = [];
  if (Array.isArray(configuredNumbers) && configuredNumbers.length > 0) {
    basePool = [...configuredNumbers];
  } else {
    const known = new Set();
    branchRooms.forEach((r) => {
      const num = String(r.roomNumber || r.number || r.room_number || "").trim();
      if (num) known.add(num);
    });
    basePool = Array.from(known);
  }

  const available = basePool.filter((num) => !usedNumbers.has(num));

  if (currentEditingRoomNumber && !available.includes(currentEditingRoomNumber)) {
    available.push(currentEditingRoomNumber);
  }

  available.sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a).localeCompare(String(b));
  });

  return available;
}

export async function fetchConfiguredFloorRoomNumbers(floorStr = "1st Floor", targetOrgId = null) {
  const orgId = targetOrgId || getCurrentOrgId();
  const params = new URLSearchParams();
  if (floorStr) params.append("floor", floorStr);
  if (orgId) params.append("orgId", orgId);
  const url = `${API_BASE_URL}/api/rooms/floor-room-numbers?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${sessionStorage.getItem("authToken")}` }
  });
  if (res.ok) {
    return await res.json();
  }
  throw new Error("Failed to fetch floor room numbers");
}

export async function addConfiguredFloorRoomNumber(floorStr, roomNumber, targetOrgId = null) {
  const orgId = targetOrgId || getCurrentOrgId();
  const url = `${API_BASE_URL}/api/rooms/floor-room-numbers`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("authToken")}`
    },
    body: JSON.stringify({
      floor: floorStr,
      roomNumber: String(roomNumber).trim(),
      orgId: orgId || undefined
    })
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return { success: true, data };
  }
  throw new Error(data.error || "Failed to add room number.");
}

export async function fetchConfiguredFloors(targetOrgId = null) {
  const orgId = targetOrgId || getCurrentOrgId();
  const params = new URLSearchParams();
  if (orgId) params.append("orgId", orgId);
  const url = `${API_BASE_URL}/api/rooms/floors?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${sessionStorage.getItem("authToken")}` }
  });
  if (res.ok) {
    const data = await res.json();
    return data?.floors || [];
  }
  
  return [
    "Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", 
    "5th Floor", "6th Floor", "7th Floor", "8th Floor", "9th Floor", "10th Floor",
  ];
}

export async function addConfiguredFloor(floorName, targetOrgId = null) {
  const orgId = targetOrgId || getCurrentOrgId();
  const url = `${API_BASE_URL}/api/rooms/floors`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("authToken")}`
    },
    body: JSON.stringify({
      floorName: String(floorName).trim(),
      orgId: orgId || undefined
    })
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return { success: true, data };
  }
  throw new Error(data.error || "Failed to add floor.");
}

export async function deleteConfiguredFloor(floorName, targetOrgId = null) {
  const orgId = targetOrgId || getCurrentOrgId();
  const url = `${API_BASE_URL}/api/rooms/floors`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("authToken")}`
    },
    body: JSON.stringify({
      floorName: String(floorName).trim(),
      orgId: orgId || undefined
    })
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return { success: true, data };
  }
  throw new Error(data.error || "Failed to delete floor.");
}

export async function deleteConfiguredFloorRoomNumber(floorStr, roomNumber, targetOrgId = null) {
  const orgId = targetOrgId || getCurrentOrgId();
  const url = `${API_BASE_URL}/api/rooms/floor-room-numbers`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("authToken")}`
    },
    body: JSON.stringify({
      floor: floorStr,
      roomNumber: String(roomNumber).trim(),
      orgId: orgId || undefined
    })
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return { success: true, data };
  }
  throw new Error(data.error || "Failed to delete room number.");
}

// Stubs for deprecated local store logic
export function checkAutoCheckoutLocal(rooms) { return rooms; }
export function bookRoomInStore() { throw new Error("Local bookRoomInStore is deprecated. Use bookRoomWithAPI."); }
export function cancelBookingInStore() { throw new Error("Local cancelBookingInStore is deprecated. Use cancelBookingWithAPI."); }
