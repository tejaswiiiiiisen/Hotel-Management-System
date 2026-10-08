import { getScopedStorageKey } from "../auth.js";

// Centralized Real-Time Notification Store & Event Bus (Scoped per Organization)
const NOTIFICATIONS_STORAGE_KEY = "hotel_notifications_store_v1";

function getActiveOrgId() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("currentOrgId") || localStorage.getItem("currentOrgId") || "";
}

function getActiveOrgName() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("currentOrg") || localStorage.getItem("currentOrg") || "";
}

function loadAllStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredNotifications(list) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("notifications_changed", { detail: { list } }));
  } catch (e) {
    console.warn("Failed saving notifications:", e);
  }
}

export function getNotifications(overrideOrgId) {
  const all = loadAllStoredNotifications();
  const currentOrgId = overrideOrgId || getActiveOrgId();
  const currentOrgName = getActiveOrgName();

  if (!currentOrgId && !currentOrgName) {
    return all;
  }

  const curId = String(currentOrgId || "").trim().toLowerCase();
  const curName = String(currentOrgName || "").trim().toLowerCase();

  return all.filter((n) => {
    if (!n.orgId) return true;
    const nOrg = String(n.orgId).trim().toLowerCase();

    return (
      nOrg === curId ||
      (curId && (curId.includes(nOrg) || nOrg.includes(curId))) ||
      (curName && (nOrg === curName || curName.includes(nOrg) || nOrg.includes(curName))) ||
      (nOrg === "ch560" && curName.includes("cheery")) ||
      (nOrg === "as435" && curName.includes("ashirwad")) ||
      (nOrg === "ma330" && curName.includes("matcha")) ||
      (nOrg === "jp01" && curName.includes("jaipur")) ||
      (nOrg === "aj01" && curName.includes("ajmer"))
    );
  });
}

export function saveNotifications(list) {
  saveStoredNotifications(list);
}

export function addNotification(item) {
  if (!item) return null;
  const all = loadAllStoredNotifications();

  const targetId = item.bookingId || item.id || item.bookingCode;
  if (targetId && all.some((n) => (n.bookingId || n.id || n.bookingCode) === targetId)) {
    return null;
  }

  const targetOrgId = item.orgId || item.org_id || getActiveOrgId() || "CH560";

  const newNotif = {
    id: item.id ? String(item.id) : `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    bookingId: targetId,
    user: item.guestName || item.user || "Website Guest",
    action: item.action || "booked room",
    target: item.roomName || item.target || (item.roomNumber ? `Room ${item.roomNumber}` : "Room"),
    message: item.message || `New Room Booking: ${item.roomName || (item.roomNumber ? `Room ${item.roomNumber}` : "Room")} booked by ${item.guestName || item.user || "Guest"} for ₹${Number(item.amountPaid || item.totalBill || 2500).toLocaleString("en-IN")}`,
    time: "Just now",
    unread: true,
    category: item.category || "Alerts",
    orgId: targetOrgId,
    avatar: item.avatar || "/images/avatars/avatar-1.png",
    timestamp: Date.now(),
    bookingDetails: item,
  };

  const updated = [newNotif, ...all];
  saveStoredNotifications(updated);
  return newNotif;
}

export function addNotificationForOrg(targetOrgId, item) {
  return addNotification({ ...item, orgId: targetOrgId });
}

export function markAllNotificationsRead() {
  const currentOrgId = getActiveOrgId();
  const currentOrgName = getActiveOrgName();
  const curId = String(currentOrgId || "").trim().toLowerCase();
  const curName = String(currentOrgName || "").trim().toLowerCase();

  const all = loadAllStoredNotifications();
  const updated = all.map((n) => {
    if (!currentOrgId && !currentOrgName) {
      return { ...n, unread: false };
    }
    const nOrg = String(n.orgId || "").trim().toLowerCase();
    const isMatch =
      nOrg === curId ||
      (curId && (curId.includes(nOrg) || nOrg.includes(curId))) ||
      (curName && (nOrg === curName || curName.includes(nOrg) || nOrg.includes(curName))) ||
      (nOrg === "ch560" && curName.includes("cheery")) ||
      (nOrg === "as435" && curName.includes("ashirwad")) ||
      (nOrg === "ma330" && curName.includes("matcha"));

    return isMatch ? { ...n, unread: false } : n;
  });

  saveStoredNotifications(updated);
}

export function markNotificationRead(id) {
  const all = loadAllStoredNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, unread: false } : n));
  saveStoredNotifications(updated);
}

export function toggleNotificationRead(id) {
  const all = loadAllStoredNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n));
  saveStoredNotifications(updated);
}

export function triggerBookingAlert(bookingData) {
  const targetOrgId = bookingData.orgId || bookingData.org_id || getActiveOrgId() || "CH560";

  try {
    const alertStorageData = {
      ...bookingData,
      orgId: targetOrgId,
      timestamp: Date.now(),
      shown: false,
    };

    localStorage.setItem(`hotel_pending_toast_${targetOrgId}`, JSON.stringify(alertStorageData));
    localStorage.setItem("hotel_new_booking_toast_alert", JSON.stringify(alertStorageData));
    window.dispatchEvent(new CustomEvent("new_room_booked_toast", { detail: alertStorageData }));

    // Add persistent notification into notification store for targetOrgId
    addNotification({
      bookingId: bookingData.id || bookingData.bookingCode,
      guestName: bookingData.guestName,
      user: bookingData.guestName,
      roomNumber: bookingData.roomNumber,
      roomName: bookingData.roomName,
      amountPaid: bookingData.amountPaid,
      orgId: targetOrgId,
      message: `New Booking: ${bookingData.roomName || `Room ${bookingData.roomNumber}`} reserved by ${bookingData.guestName || "Website Guest"} (₹${Number(bookingData.amountPaid || 2500).toLocaleString("en-IN")})`,
    });
  } catch (e) {
    console.warn("Trigger booking alert dispatch failed:", e);
  }

  return null;
}

export function subscribeNotifications(callback) {
  const handler = () => callback(getNotifications());
  window.addEventListener("notifications_changed", handler);
  window.addEventListener("storage", handler);
  window.addEventListener("current_org_changed", handler);
  return () => {
    window.removeEventListener("notifications_changed", handler);
    window.removeEventListener("storage", handler);
    window.removeEventListener("current_org_changed", handler);
  };
}

// Real-time API Poller for Website Bookings -> Admin Notifications
export async function pollApiBookingsForNotifications() {
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !Array.isArray(data.bookings) || data.bookings.length === 0) return;

    const currentBookings = data.bookings;
    const lastSeenStr = localStorage.getItem("hotel_last_seen_booking_pkid");
    const lastSeenPkId = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;

    if (!lastSeenStr) {
      const maxPkId = Math.max(...currentBookings.map((b) => Number(b.pkId || b.id || 0)));
      localStorage.setItem("hotel_last_seen_booking_pkid", String(maxPkId));

      // Populate existing bookings as read notifications initially if empty
      const existingNotifs = loadAllStoredNotifications();
      if (existingNotifs.length === 0) {
        currentBookings.slice(0, 10).forEach((b) => {
          const bPkId = Number(b.pkId || 0);
          const bOrgId = b.orgId || b.org_id || "CH560";
          addNotification({
            id: `booking_${bPkId}`,
            bookingId: bPkId || b.id,
            guestName: b.guestName || "Website Guest",
            user: b.guestName || "Website Guest",
            roomNumber: b.roomNumber || "101",
            roomName: b.roomName || `Room ${b.roomNumber || "101"}`,
            amountPaid: b.amountPaid || 2500,
            orgId: bOrgId,
            unread: false,
            message: `Booking Record: ${b.roomName || `Room ${b.roomNumber || "101"}`} reserved by ${b.guestName || "Website Guest"} (₹${Number(b.amountPaid || 2500).toLocaleString("en-IN")})`,
          });
        });
      }
      return;
    }

    const newBookings = currentBookings
      .filter((b) => Number(b.pkId || 0) > lastSeenPkId)
      .sort((a, b) => Number(a.pkId || 0) - Number(b.pkId || 0));

    for (const b of newBookings) {
      const bPkId = Number(b.pkId || 0);
      const bOrgId = b.orgId || b.org_id || "CH560";

      localStorage.setItem("hotel_last_seen_booking_pkid", String(bPkId));

      triggerBookingAlert({
        id: bPkId || Date.now(),
        bookingCode: b.id || `RES-${Math.floor(10000 + Math.random() * 90000)}`,
        roomNumber: b.roomNumber || "101",
        roomName: b.roomName || `Room ${b.roomNumber || "101"}`,
        guestName: b.guestName || "Website Guest",
        checkInDate: b.checkInDate || "Today",
        checkOutDate: b.checkOutDate || "Upcoming",
        amountPaid: b.amountPaid || 2500,
        paymentMethod: b.paymentMethod || "Website Online Payment",
        orgId: bOrgId,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    // API server might be starting up
  }
}

if (typeof window !== "undefined") {
  pollApiBookingsForNotifications();
  setInterval(pollApiBookingsForNotifications, 3000);
}

