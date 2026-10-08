import { showSuccess, showError, showWarning, showInfo } from "./toast.js";
import { logAction } from "../audit.js";
import { getCurrentOrg, getCurrentOrgId, getScopedStorageKey } from "../auth.js";
import { fetchRooms as fetchRoomsAPI, createRoomAPI, deleteRoomAPI } from "../services/roomService.js";
import { createBookingAPI, checkoutBookingAPI, checkinBookingAPI } from "../services/bookingService.js";
import { addNotification } from "../services/notificationStore.js";
import { addHkTask } from "../services/housekeepingStore.js";

const API_BASE_URL = "http://localhost:4000";
const API_BASE = "http://localhost:4000/api/rooms";

export function getStorageKey() {
  return getScopedStorageKey("hotel_rooms");
}

export function getRooms() {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((r, idx) => formatRoomForAdmin(r, idx));
      }
    }
    // Fallback: Check non-scoped generic key
    if (key !== "hotel_rooms") {
      const genericRaw = localStorage.getItem("hotel_rooms");
      if (genericRaw) {
        const parsed = JSON.parse(genericRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r, idx) => formatRoomForAdmin(r, idx));
        }
      }
    }
    // Seed initial authentic rooms
    if (Array.isArray(INITIAL_ROOMS) && INITIAL_ROOMS.length > 0) {
      const formatted = INITIAL_ROOMS.map((r, idx) => formatRoomForAdmin(r, idx));
      saveRooms(formatted);
      return formatted;
    }
  } catch (e) {
    console.warn("Failed to read rooms from localStorage:", e);
  }
  return INITIAL_ROOMS.map((r, idx) => formatRoomForAdmin(r, idx));
}

export function saveRooms(rooms) {
  try {
    const key = getStorageKey();
    if (Array.isArray(rooms)) {
      localStorage.setItem(key, JSON.stringify(rooms));
      window.dispatchEvent(new CustomEvent("hotel_rooms_updated", { detail: rooms }));
    }
  } catch (e) {
    console.warn("Failed to save rooms to localStorage:", e);
  }
}

export const INITIAL_ROOMS = [
  {
    id: 101,
    roomNumber: "101",
    name: "Room 101 - Executive Standard",
    type: "Standard",
    floor: "1st Floor",
    price: 2500,
    pricePerNight: 2500,
    capacity: 2,
    beds: "1 King Bed",
    sizeSqm: 28,
    status: "Available",
    available: true,
    roomView: "Garden View",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "TV", "Room Service", "King Bed", "Private Bathroom"],
  },
  {
    id: 102,
    roomNumber: "102",
    name: "Room 102 - Executive Suite",
    type: "Suite",
    floor: "1st Floor",
    price: 3800,
    pricePerNight: 3800,
    capacity: 3,
    beds: "1 King Bed + Sofa",
    sizeSqm: 38,
    status: "Available",
    available: true,
    roomView: "Lake View",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "TV", "Minibar", "Balcony", "Private Bathroom"],
  },
  {
    id: 103,
    roomNumber: "103",
    name: "Room 103 - Deluxe Garden Room",
    type: "Deluxe",
    floor: "1st Floor",
    price: 3200,
    pricePerNight: 3200,
    capacity: 2,
    beds: "1 Queen Bed",
    sizeSqm: 30,
    status: "Dirty",
    available: true,
    roomView: "Garden View",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "TV", "Coffee Maker", "Private Bathroom"],
  },
  {
    id: 104,
    roomNumber: "104",
    name: "Room 104 - Standard Room",
    type: "Standard",
    floor: "1st Floor",
    price: 2500,
    pricePerNight: 2500,
    capacity: 2,
    beds: "1 King Bed",
    sizeSqm: 28,
    status: "Available",
    available: true,
    roomView: "Courtyard View",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "TV", "Room Service", "King Bed", "Private Bathroom"],
  },
  {
    id: 105,
    roomNumber: "105",
    name: "Room 105 - Superior King",
    type: "Standard",
    floor: "1st Floor",
    price: 2800,
    pricePerNight: 2800,
    capacity: 2,
    beds: "1 King Bed",
    sizeSqm: 32,
    status: "Cleaning",
    available: true,
    roomView: "Pool View",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "TV", "Balcony", "Safe", "Private Bathroom"],
  },
  {
    id: 201,
    roomNumber: "201",
    name: "Room 201 - Luxury Palace Suite",
    type: "Presidential Suite",
    floor: "2nd Floor",
    price: 5500,
    pricePerNight: 5500,
    capacity: 4,
    beds: "2 Royal King Beds",
    sizeSqm: 55,
    status: "Available",
    available: true,
    roomView: "Palace View",
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "Jacuzzi", "Minibar", "Balcony", "Room Service"],
  },
  {
    id: 202,
    roomNumber: "202",
    name: "Room 202 - Super Deluxe King",
    type: "Super Deluxe",
    floor: "2nd Floor",
    price: 4200,
    pricePerNight: 4200,
    capacity: 2,
    beds: "1 King Bed",
    sizeSqm: 36,
    status: "Dirty",
    available: true,
    roomView: "City View",
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "Smart TV", "Mini Fridge", "Private Bathroom"],
  },
  {
    id: 204,
    roomNumber: "204",
    name: "Room 204 - Deluxe Suite",
    type: "Deluxe Suite",
    floor: "2nd Floor",
    price: 4800,
    pricePerNight: 4800,
    capacity: 3,
    beds: "1 King Bed + Lounge",
    sizeSqm: 42,
    status: "Cleaning",
    available: true,
    roomView: "Lake View",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "TV", "Lounge Area", "Bathtub", "Private Bathroom"],
  },
  {
    id: 301,
    roomNumber: "301",
    name: "Room 301 - Executive Suite",
    type: "Executive Suite",
    floor: "3rd Floor",
    price: 5000,
    pricePerNight: 5000,
    capacity: 3,
    beds: "1 King Bed",
    sizeSqm: 46,
    status: "Available",
    available: true,
    roomView: "Mountain View",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "Workstation", "Coffee Maker", "Bathtub", "Private Bathroom"],
  },
  {
    id: 302,
    roomNumber: "302",
    name: "Room 302 - Deluxe Suite",
    type: "Deluxe Suite",
    floor: "3rd Floor",
    price: 4500,
    pricePerNight: 4500,
    capacity: 2,
    beds: "1 Queen Bed",
    sizeSqm: 38,
    status: "Cleaning",
    available: true,
    roomView: "Skyline View",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "TV", "Minibar", "Walk-in Shower"],
  },
  {
    id: 501,
    roomNumber: "501",
    name: "Room 501 - Penthouse Villa",
    type: "Penthouse Villa",
    floor: "5th Floor",
    price: 9500,
    pricePerNight: 9500,
    capacity: 4,
    beds: "2 Master King Beds",
    sizeSqm: 85,
    status: "Available",
    available: true,
    roomView: "Panoramic 360° View",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Free Wi-Fi", "Private Terrace", "Jacuzzi", "Butler Service", "Full Bar", "Luxury Bathrobes"],
  }
];

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

  try {
    const res = await fetch(url, { 
      headers: { 
        Authorization: token ? `Bearer ${token}` : "",
        "x-org-id": currentOrgId || "",
        "x-org-name": currentOrg || "",
      },
      credentials: "include",
    });
    
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data.allRooms || data.rooms || []);
      if (rawList.length > 0) {
        const formatted = rawList.map((r, idx) => formatRoomForAdmin(r, idx));
        saveRooms(formatted);
        return formatted;
      }
    }
  } catch (err) {
    console.warn("fetchRoomsFromApi failed, using cached store:", err);
  }

  // Fallback to local storage if API is down or empty
  const cached = getRooms();
  return cached;
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

  const numStr = String(roomData.number || roomData.roomNumber || "").trim();
  const roomName = roomData.name || roomData.title || `Room ${numStr} - ${roomData.type || "Standard"}`;

  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  const currentOrgId = getCurrentOrgId();
  const currentOrg = getCurrentOrg() || "Matcha Tea";

  // Format new room object
  const newRoomObj = formatRoomForAdmin({
    ...roomData,
    id: roomData.id || Date.now(),
    name: roomName,
    title: roomName,
    number: numStr,
    roomNumber: numStr,
    floor: roomData.floor || deriveFloorFromNumber(numStr),
    type: roomData.type || "Standard",
    price: Number(roomData.price || roomData.pricePerNight || 2500),
    pricePerNight: Number(roomData.price || roomData.pricePerNight || 2500),
    beds: roomData.beds || "1 King Bed",
    guests: Number(roomData.guests || roomData.capacity || 2),
    capacity: Number(roomData.guests || roomData.capacity || 2),
    images: imagesArr,
    amenities: amenitiesArr,
    status: roomData.status || "Available",
    available: (roomData.status || "Available").toLowerCase() === "occupied" ? false : true,
  });

  // 1. Save to local storage immediately
  const existingRooms = getRooms();
  const alreadyExistsIndex = existingRooms.findIndex(
    (r) => String(r.number || r.roomNumber) === numStr
  );
  let updatedRoomsList;
  if (alreadyExistsIndex >= 0) {
    updatedRoomsList = existingRooms.map((r, idx) => (idx === alreadyExistsIndex ? newRoomObj : r));
  } else {
    updatedRoomsList = [newRoomObj, ...existingRooms];
  }
  saveRooms(updatedRoomsList);

  // 2. Persist to backend database API
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "x-org-id": currentOrgId || "",
        "x-org-name": currentOrg || "",
      },
      credentials: "include",
      body: JSON.stringify({
        name: roomName,
        type: roomData.type || "Standard",
        roomNumber: numStr,
        floor: roomData.floor || deriveFloorFromNumber(numStr),
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
        available: (roomData.status || "Available").toLowerCase() === "occupied" ? false : true,
        orgId: currentOrgId || undefined,
        org: currentOrg,
      }),
    });

    if (res.ok) {
      const apiRooms = await fetchRoomsFromApi();
      if (apiRooms && apiRooms.length > 0) {
        saveRooms(apiRooms);
        return apiRooms;
      }
    }
  } catch (err) {
    console.warn("Backend room save error, preserved in local store:", err);
  }

  return updatedRoomsList;
}

export const createRoomInApi = addRoomToApi;

export async function addRoomWithAPI(roomData) {
  return addRoomToApi(roomData);
}

export async function updateRoomInApi(roomId, roomData) {
  // Update in local store
  const existingRooms = getRooms();
  const updatedRoomsList = existingRooms.map((r) => {
    if (String(r.id) === String(roomId) || String(r.number) === String(roomData.number || roomData.roomNumber)) {
      return formatRoomForAdmin({ ...r, ...roomData });
    }
    return r;
  });
  saveRooms(updatedRoomsList);

  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  const currentOrgId = getCurrentOrgId();
  const currentOrg = getCurrentOrg() || "Matcha Tea";

  try {
    const res = await fetch(`${API_BASE}/${roomId}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "x-org-id": currentOrgId || "",
        "x-org-name": currentOrg || "",
      },
      credentials: "include",
      body: JSON.stringify(roomData),
    });
    
    if (res.ok) {
      const refreshed = await fetchRoomsFromApi();
      if (refreshed && refreshed.length > 0) {
        saveRooms(refreshed);
        return refreshed;
      }
    }
  } catch (err) {
    console.warn("updateRoomInApi error, updated in local cache:", err);
  }
  
  return updatedRoomsList;
}

export async function deleteRoomFromApi(roomId) {
  const existingRooms = getRooms();
  const updatedRoomsList = existingRooms.filter((r) => String(r.id) !== String(roomId));
  saveRooms(updatedRoomsList);

  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  try {
    const res = await fetch(`${API_BASE}/${roomId}`, { 
      method: "DELETE", 
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      credentials: "include",
    });
    
    if (res.ok) {
      const refreshed = await fetchRoomsFromApi();
      if (refreshed && refreshed.length > 0) {
        saveRooms(refreshed);
        return refreshed;
      }
    }
  } catch (err) {
    console.warn("deleteRoomFromApi error, deleted from local cache:", err);
  }
  
  return updatedRoomsList;
}

export const deleteRoomInApi = deleteRoomFromApi;

export async function deleteRoomWithAPI(roomId) {
  return deleteRoomFromApi(roomId);
}

export async function bookRoomWithAPI(room, bookingData, staffName, alreadyCreated = false) {
  const isAlreadyCreated = alreadyCreated || bookingData?._alreadyCreated;
  let apiResult = isAlreadyCreated ? { success: true } : null;

  if (!isAlreadyCreated) {
    apiResult = await createBookingAPI({
      roomId: room.id,
      roomUid: room.roomUid || room.room_uid || undefined,
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
  }

  // Optimistically mark room as Occupied in local cache
  try {
    const rooms = getRooms();
    const updated = rooms.map((r) => {
      if (String(r.id) === String(room.id) || String(r.number) === String(room.number)) {
        return { ...r, status: "Occupied", available: false };
      }
      return r;
    });
    saveRooms(updated);
  } catch (e) {
    console.warn("Optimistic local room update error:", e);
  }

  const apiRooms = await fetchRoomsFromAPI();
  return apiRooms || getRooms();
}


/**
 * Cancel/checkout a booking via API first, then fetch latest state.
 */
export async function cancelBookingWithAPI(roomId, bookingPkId) {
  let pkIdToUse = bookingPkId;

  if (!pkIdToUse) {
    const apiRooms = await fetchRoomsFromAPI();
    const theRoom = apiRooms?.find(r => String(r.id) === String(roomId));
    if (theRoom?.booking?.pkId) {
      pkIdToUse = theRoom.booking.pkId;
    }
  }

  if (pkIdToUse) {
    await checkoutBookingAPI(pkIdToUse);
  } else {
    // If no booking found, just mark the room as Available manually
    await updateRoomInApi(roomId, { status: "Available" });
  }

  // Update local cache but don't call updateRoomInApi again to prevent overwriting 'Cleaning' status
  const rooms = getRooms();
  const updated = rooms.map((r) => {
    if (String(r.id) === String(roomId)) {
      const { booking, ...rest } = r;
      return { ...rest, status: pkIdToUse ? "Cleaning" : "Available" };
    }
    return r;
  });
  saveRooms(updated);

  // Refresh from API to get the real state
  const apiRooms = await fetchRoomsFromAPI();
  return apiRooms || updated;
}

/**
 * Check-in a booking via API first, then fetch latest state.
 */
export async function checkinBookingWithAPI(roomId, bookingPkId) {
  let pkIdToUse = bookingPkId;

  if (!pkIdToUse) {
    const apiRooms = await fetchRoomsFromAPI();
    const theRoom = apiRooms?.find(r => String(r.id) === String(roomId));
    if (theRoom?.booking?.pkId) {
      pkIdToUse = theRoom.booking.pkId;
    }
  }

  if (pkIdToUse) {
    await checkinBookingAPI(pkIdToUse);
  }
  return await fetchRoomsFromAPI();
}

export function getFloorNumber(floorStr) {
  if (!floorStr) return 1;
  const match = String(floorStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export function getFloorRoomPool(floorStr, count = 10) {
  if (!floorStr) floorStr = "1st Floor";
  const str = String(floorStr).trim().toLowerCase();

  if (str.includes("ground") || str.startsWith("g")) {
    const pool = [];
    for (let i = 1; i <= count; i++) {
      pool.push(`G${String(i).padStart(2, "0")}`);
    }
    return pool;
  }
  if (str.includes("basement") || str.startsWith("b")) {
    const pool = [];
    for (let i = 1; i <= count; i++) {
      pool.push(`B${String(i).padStart(2, "0")}`);
    }
    return pool;
  }
  if (str.includes("penthouse") || str.startsWith("ph")) {
    const pool = [];
    for (let i = 1; i <= count; i++) {
      pool.push(`PH${String(i).padStart(2, "0")}`);
    }
    return pool;
  }

  const match = String(floorStr).match(/\d+/);
  const floorNum = match ? parseInt(match[0], 10) : 1;
  const pool = [];
  const base = floorNum * 100;
  for (let i = 1; i <= count; i++) {
    const num = base + i;
    pool.push(String(num));
  }
  return pool;
}

export function getAllFloorRoomNumbers(floorStr = "1st Floor", configuredNumbers = null) {
  const default10 = getFloorRoomPool(floorStr, 10);
  const numbersSet = new Set(default10);
  if (Array.isArray(configuredNumbers) && configuredNumbers.length > 0) {
    configuredNumbers.forEach((n) => {
      if (n) numbersSet.add(String(n).trim());
    });
  }
  const allNumbers = Array.from(numbersSet);
  allNumbers.sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a).localeCompare(String(b));
  });
  return allNumbers;
}

export function getAvailableRoomNumbers(roomsList = [], floorStr = "1st Floor", editingRoomId = null, currentOrgId = null, configuredNumbers = null) {
  const basePool = getAllFloorRoomNumbers(floorStr, configuredNumbers);
  const usedNumbers = new Set();
  let currentEditingRoomNumber = null;

  (Array.isArray(roomsList) ? roomsList : []).forEach((r) => {
    if (!r) return;
    const num = String(r.roomNumber || r.number || r.room_number || "").trim();
    if (!num) return;
    if (editingRoomId && String(r.id) === String(editingRoomId)) {
      currentEditingRoomNumber = num;
      return;
    }
    const rFloor = r.floor || deriveFloorFromNumber(num);
    if (String(rFloor).toLowerCase().trim() === String(floorStr).toLowerCase().trim() || basePool.includes(num)) {
      usedNumbers.add(num);
    }
  });

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

export const DEFAULT_CONFIGURED_FLOORS = [
  "Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", 
  "5th Floor", "6th Floor", "7th Floor", "8th Floor", "9th Floor", "10th Floor",
];

export function getStoredFloors() {
  try {
    const key = getScopedStorageKey("hotel_configured_floors");
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read floors from localStorage:", e);
  }
  return DEFAULT_CONFIGURED_FLOORS;
}

export function saveStoredFloors(floors) {
  try {
    const key = getScopedStorageKey("hotel_configured_floors");
    if (Array.isArray(floors)) {
      localStorage.setItem(key, JSON.stringify(floors));
      window.dispatchEvent(new CustomEvent("hotel_floors_updated", { detail: floors }));
    }
  } catch (e) {
    console.warn("Failed to save floors to localStorage:", e);
  }
}

export function getStoredFloorRoomNumbersMap() {
  try {
    const key = getScopedStorageKey("hotel_configured_floor_room_numbers");
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.warn("Failed to read floor room numbers map:", e);
  }
  return {};
}

export function saveStoredFloorRoomNumbersMap(map) {
  try {
    const key = getScopedStorageKey("hotel_configured_floor_room_numbers");
    if (map && typeof map === "object") {
      localStorage.setItem(key, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent("hotel_floor_rooms_updated", { detail: map }));
    }
  } catch (e) {
    console.warn("Failed to save floor room numbers map:", e);
  }
}

export async function fetchConfiguredFloors(targetOrgId = null) {
  const localFloors = getStoredFloors();
  const orgId = targetOrgId || getCurrentOrgId();
  const params = new URLSearchParams();
  if (orgId) params.append("orgId", orgId);
  const url = `${API_BASE_URL}/api/rooms/floors?${params.toString()}`;
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "x-org-id": orgId || "",
        "x-org-name": getCurrentOrg() || "",
      },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      const apiFloors = Array.isArray(data?.floors) ? data.floors : [];
      if (apiFloors.length > 0) {
        const mergedSet = new Set([...DEFAULT_CONFIGURED_FLOORS, ...localFloors, ...apiFloors]);
        const sorted = Array.from(mergedSet);
        saveStoredFloors(sorted);
        return sorted;
      }
    }
  } catch (err) {
    console.warn("fetchConfiguredFloors API failed, using cached floors:", err);
  }
  return localFloors;
}

export async function addConfiguredFloor(floorName, targetOrgId = null) {
  const cleanFloor = String(floorName || "").trim();
  if (!cleanFloor) return { success: false, error: "Floor name is required." };

  // 1. Optimistic local storage update
  const currentFloors = getStoredFloors();
  if (!currentFloors.includes(cleanFloor)) {
    const nextFloors = [...currentFloors, cleanFloor];
    saveStoredFloors(nextFloors);
  }

  // 2. Persist to API
  const orgId = targetOrgId || getCurrentOrgId();
  const url = `${API_BASE_URL}/api/rooms/floors`;
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "x-org-id": orgId || "",
        "x-org-name": getCurrentOrg() || "",
      },
      credentials: "include",
      body: JSON.stringify({
        floorName: cleanFloor,
        orgId: orgId || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { success: true, floorName: cleanFloor, data };
  } catch (err) {
    console.warn("addConfiguredFloor API network issue, preserved locally:", err);
    return { success: true, floorName: cleanFloor, localOnly: true };
  }
}

export async function deleteConfiguredFloor(floorName, targetOrgId = null) {
  const cleanFloor = String(floorName || "").trim();
  // 1. Local update
  const currentFloors = getStoredFloors();
  saveStoredFloors(currentFloors.filter((f) => f !== cleanFloor));

  // 2. API delete
  const orgId = targetOrgId || getCurrentOrgId();
  const url = `${API_BASE_URL}/api/rooms/floors`;
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";

  try {
    await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "x-org-id": orgId || "",
        "x-org-name": getCurrentOrg() || "",
      },
      credentials: "include",
      body: JSON.stringify({
        floorName: cleanFloor,
        orgId: orgId || undefined,
      }),
    });
  } catch (err) {
    console.warn("deleteConfiguredFloor API issue:", err);
  }
  return { success: true, floorName: cleanFloor };
}

export async function fetchConfiguredFloorRoomNumbers(floorStr = "1st Floor", targetOrgId = null) {
  const orgId = targetOrgId || getCurrentOrgId();
  const floorKey = String(floorStr || "1st Floor").trim();
  const map = getStoredFloorRoomNumbersMap();
  const localNums = Array.isArray(map[floorKey]) ? map[floorKey] : [];

  const params = new URLSearchParams();
  if (floorKey) params.append("floor", floorKey);
  if (orgId) params.append("orgId", orgId);
  const url = `${API_BASE_URL}/api/rooms/floor-room-numbers?${params.toString()}`;
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "x-org-id": orgId || "",
        "x-org-name": getCurrentOrg() || "",
      },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      const apiNums = Array.isArray(data?.configuredNumbers) ? data.configuredNumbers : [];
      const standard10 = getAllFloorRoomNumbers(floorKey);
      const mergedSet = new Set([...standard10, ...localNums, ...apiNums]);
      const mergedArr = Array.from(mergedSet).sort((a, b) => {
        const nA = Number(a);
        const nB = Number(b);
        if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
        return String(a).localeCompare(String(b));
      });

      map[floorKey] = mergedArr;
      saveStoredFloorRoomNumbersMap(map);

      return {
        success: true,
        floor: floorKey,
        configuredNumbers: mergedArr,
        availableNumbers: Array.isArray(data?.availableNumbers) ? data.availableNumbers : mergedArr,
      };
    }
  } catch (err) {
    console.warn("fetchConfiguredFloorRoomNumbers API failed, using cached:", err);
  }

  const standard10 = getAllFloorRoomNumbers(floorKey);
  const combined = Array.from(new Set([...standard10, ...localNums])).sort((a, b) => {
    const nA = Number(a);
    const nB = Number(b);
    if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
    return String(a).localeCompare(String(b));
  });

  return {
    success: true,
    floor: floorKey,
    configuredNumbers: combined,
    availableNumbers: combined,
  };
}

export async function addConfiguredFloorRoomNumber(floorStr, roomNumber, targetOrgId = null) {
  const cleanFloor = String(floorStr || "1st Floor").trim();
  const cleanNum = String(roomNumber || "").trim();
  if (!cleanNum) return { success: false, error: "Room number is required." };

  // 1. Optimistic local update
  const map = getStoredFloorRoomNumbersMap();
  const existingList = Array.isArray(map[cleanFloor]) ? map[cleanFloor] : [];
  if (!existingList.includes(cleanNum)) {
    map[cleanFloor] = [...existingList, cleanNum];
    saveStoredFloorRoomNumbersMap(map);
  }

  // 2. API post
  const orgId = targetOrgId || getCurrentOrgId();
  const url = `${API_BASE_URL}/api/rooms/floor-room-numbers`;
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "x-org-id": orgId || "",
        "x-org-name": getCurrentOrg() || "",
      },
      credentials: "include",
      body: JSON.stringify({
        floor: cleanFloor,
        roomNumber: cleanNum,
        orgId: orgId || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { success: true, floor: cleanFloor, roomNumber: cleanNum, data };
  } catch (err) {
    console.warn("addConfiguredFloorRoomNumber API issue, preserved locally:", err);
    return { success: true, floor: cleanFloor, roomNumber: cleanNum, localOnly: true };
  }
}

export async function deleteConfiguredFloorRoomNumber(floorStr, roomNumber, targetOrgId = null) {
  const cleanFloor = String(floorStr || "1st Floor").trim();
  const cleanNum = String(roomNumber || "").trim();

  // 1. Local update
  const map = getStoredFloorRoomNumbersMap();
  if (Array.isArray(map[cleanFloor])) {
    map[cleanFloor] = map[cleanFloor].filter((n) => n !== cleanNum);
    saveStoredFloorRoomNumbersMap(map);
  }

  // 2. API delete
  const orgId = targetOrgId || getCurrentOrgId();
  const url = `${API_BASE_URL}/api/rooms/floor-room-numbers`;
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";

  try {
    await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "x-org-id": orgId || "",
        "x-org-name": getCurrentOrg() || "",
      },
      credentials: "include",
      body: JSON.stringify({
        floor: cleanFloor,
        roomNumber: cleanNum,
        orgId: orgId || undefined,
      }),
    });
  } catch (err) {
    console.warn("deleteConfiguredFloorRoomNumber API issue:", err);
  }
  return { success: true, floor: cleanFloor, roomNumber: cleanNum };
}

// Stubs for deprecated local store logic
export function checkAutoCheckoutLocal(rooms) { return rooms; }
export function bookRoomInStore() { throw new Error("Local bookRoomInStore is deprecated. Use bookRoomWithAPI."); }
export function cancelBookingInStore() { throw new Error("Local cancelBookingInStore is deprecated. Use cancelBookingWithAPI."); }

