import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiHeart,
  FiUsers,
  FiMaximize,
  FiWifi,
  FiWind,
  FiTv,
  FiCheck,
  FiStar,
  FiCalendar,
  FiUser,
  FiCoffee,
  FiClock,
  FiShield,
  FiMapPin,
  FiCheckCircle,
  FiInfo,
  FiPhone,
  FiMail,
  FiFileText,
  FiLayers,
} from "react-icons/fi";
import { TbBed } from "react-icons/tb";
import {
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import PaymentWalletIcon from "../components/PaymentWalletIcon.jsx";
import BookRoomModal from "../components/BookRoomModal.jsx";
import {
  getRooms,
  fetchRoomsFromAPI,
  bookRoomWithAPI,
  cancelBookingWithAPI,
  checkinBookingWithAPI,
  updateRoomInApi,
} from "../utils/roomStore.js";
import {
  getCustomers,
  updateCustomerPaymentAPI,
} from "../utils/customerStore.js";
import { fetchAllBookings } from "../services/bookingService.js";
import { getUserName } from "../auth.js";
import { showSuccess, showError } from "../utils/toast.js";
import { addNotification } from "../services/notificationStore.js";

// Helper to pick matching luxury icons for amenities
function getAmenityIcon(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet") || lower.includes("wi-fi")) return <FiWifi />;
  if (lower.includes("air") || lower.includes("ac") || lower.includes("climate") || lower.includes("conditioning")) return <FiWind />;
  if (lower.includes("tv") || lower.includes("television") || lower.includes("screen")) return <FiTv />;
  if (lower.includes("coffee") || lower.includes("tea") || lower.includes("breakfast") || lower.includes("minibar")) return <FiCoffee />;
  if (lower.includes("user") || lower.includes("guest") || lower.includes("service")) return <FiUser />;
  if (lower.includes("bed") || lower.includes("linen")) return <TbBed />;
  if (lower.includes("safe") || lower.includes("security")) return <FiShield />;
  return <FiCheckCircle />;
}

export default function RoomDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [roomsList, setRoomsList] = useState(getRooms);
  const [apiBooking, setApiBooking] = useState(null); // booking from the API
  const [roomHistoryList, setRoomHistoryList] = useState([]); // history of bookings for this room
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentWarningModal, setPaymentWarningModal] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Theme listener
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  // Load rooms + bookings from API
  const loadData = useCallback(async () => {
    try {
      const [apiRooms, bookings] = await Promise.all([
        fetchRoomsFromAPI(),
        fetchAllBookings({ status: "Active Stay" }),
      ]);
      if (apiRooms) setRoomsList(apiRooms);
      else setRoomsList(getRooms());

      // Find the booking for this room
      if (bookings) {
        // Combine unique history entries
        const mapById = new Map();
        (bookings || []).forEach((b) => {
          const key = b.id || b.pkId || b.bookingCode || `${b.checkInDate}-${b.guestName}`;
          if (!mapById.has(key)) mapById.set(key, b);
        });
        const combined = Array.from(mapById.values());

        setRoomHistoryList(combined);

        // Find active booking for Current Guest Booking Details card
        const activeMatch = combined.find(
          (b) =>
            (String(b.roomId) === String(id) || String(b.roomNumber) === String(id)) &&
            (b.status === "Active Stay" ||
              b.status === "Occupied" ||
              b.status === "Booked" ||
              b.status === "Reserved" ||
              b.status === "Active")
        );

        setApiBooking(activeMatch || null);
      }
    } catch (err) {
      console.error("RoomDetails loadData failed:", err);
      setRoomsList(getRooms());
    }
  }, [id]);

  useEffect(() => {
    loadData();
    const observer = new MutationObserver(() => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(currentTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [loadData]);

  const isDark = theme === "dark";

  const room = roomsList.find(
    (item) =>
      String(item.id) === String(id) ||
      String(item.number || item.roomNumber) === String(id) ||
      item.slug === String(id)
  );

  if (!room) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: isDark ? "#334155" : "#f1f5f9",
            color: "#6366f1",
            fontSize: "24px",
            marginBottom: "16px",
          }}
        >
          <TbBed />
        </div>
        <h2 style={{ color: isDark ? "#ffffff" : "#0f172a", marginBottom: "8px" }}>
          Room Not Found
        </h2>
        <p style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "14px", marginBottom: "20px" }}>
          The requested room details could not be retrieved or the room has been unlisted.
        </p>
        <button
          type="button"
          onClick={() => navigate("/rooms")}
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#ffffff",
            padding: "10px 24px",
            borderRadius: "999px",
            border: "none",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
          }}
        >
          &larr; Back to Rooms Management
        </button>
      </div>
    );
  }

  // Merge local booking with API booking
  const booking =
    room.booking ||
    (apiBooking
      ? {
          guestName: apiBooking.guestName || "Guest",
          bookingId: apiBooking.bookingCode,
          pkId: apiBooking.pkId,
          checkIn: apiBooking.checkInDate,
          checkOut: apiBooking.checkOutDate,
          phone: apiBooking.guestPhone,
          email: apiBooking.guestEmail,
          source: apiBooking.source,
          bookedBy: apiBooking.bookedBy,
          paymentStatus: apiBooking.paymentStatus,
          paymentMethod: apiBooking.paymentMethod,
          amountPaid: apiBooking.amountPaid,
          nightlyRate: apiBooking.nightlyRate,
          nights: apiBooking.nights,
          guests: apiBooking.guests,
          guestList: apiBooking.guestList,
          document: null,
        }
      : null);

  async function handleConfirmBooking(bookingData, alreadyCreated = true) {
    try {
      const staffName = getUserName() || "Staff";
      const updated = await bookRoomWithAPI(
        room,
        bookingData,
        staffName,
        alreadyCreated
      );
      if (updated) setRoomsList(updated);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.warn("handleConfirmBooking error:", err);
      setIsModalOpen(false);
      await loadData();
    }
  }

  async function handleCheckinBooking() {
    if (!booking) return;

    try {
      const validBookingPkId =
        booking.pkId || booking.id || apiBooking?.pkId || apiBooking?.id;

      const updatedRooms = await checkinBookingWithAPI(
        room.id,
        validBookingPkId
      );

      const matchedRoom = updatedRooms.find(
        (r) =>
          String(r.id) === String(room.id) ||
          String(r.number) === String(room.number)
      );
      if (matchedRoom) {
        setRoomsList(updatedRooms);
      }

      if (typeof addNotification === "function") {
        addNotification({
          user: "System",
          action: "checked in a booking",
          target: `Room ${room.number || room.id}`,
          message: `✅ Guest checked into Room ${room.number || room.id}. Status changed to Occupied.`,
          category: "Success",
          type: "success",
        });
      }

      showSuccess("Guest checked in successfully!");
      await loadData();
    } catch (err) {
      showError(err?.message || "Failed to check in.");
    }
  }

  async function handleCancelBooking() {
    if (!booking) return;

    const customers = getCustomers();
    const guestNameLower = (booking.guestName || "").trim().toLowerCase();
    const customer = customers.find(
      (c) => c.name.trim().toLowerCase() === guestNameLower
    );

    const isPaid = customer
      ? customer.paymentStatus === "Paid"
      : booking.paymentStatus === "Paid" ||
        booking.paymentStatus === "Paid In Full";

    const validBookingPkId =
      booking.pkId || booking.id || apiBooking?.pkId || apiBooking?.id;

    if (!isPaid) {
      setPaymentWarningModal({
        guestName: booking.guestName,
        totalBill: customer
          ? customer.totalBill
          : booking.amountPaid || room.price * 2,
        customerId: customer ? customer.id : null,
        bookingPkId: validBookingPkId,
      });
      return;
    }

    if (window.confirm("Confirm Check-Out for " + booking.guestName + "?")) {
      try {
        const updated = await cancelBookingWithAPI(room.id, validBookingPkId);
        setRoomsList(updated);
        setApiBooking(null);
        await loadData();
        showSuccess("Checked out successfully.");
      } catch (err) {
        showError(err?.message || "Checkout failed");
      }
    }
  }

  async function handleCollectAndCheckout() {
    try {
      if (paymentWarningModal?.customerId) {
        await updateCustomerPaymentAPI(
          paymentWarningModal.customerId,
          "Paid",
          paymentWarningModal.totalBill
        );
      }
      const updated = await cancelBookingWithAPI(
        room.id,
        paymentWarningModal?.bookingPkId
      );
      setRoomsList(updated);
      setApiBooking(null);
      setPaymentWarningModal(null);
      await loadData();
      showSuccess("Payment collected and checked out!");
    } catch (err) {
      showError(err?.message || "Failed to process payment and checkout");
    }
  }

  async function handleRoomStatusToggle(newStatus) {
    const isAvailable =
      newStatus.toLowerCase() === "available" ||
      newStatus.toLowerCase() === "cleaning";
    const updated = roomsList.map((r) => {
      if (String(r.id) === String(room.id)) {
        return { ...r, status: newStatus, available: isAvailable };
      }
      return r;
    });
    setRoomsList(updated);

    await updateRoomInApi(room.id, {
      status: newStatus,
      available: isAvailable,
    });
    const refreshed = await fetchRoomsFromAPI();
    if (refreshed) setRoomsList(refreshed);
    showSuccess(`Room status updated to ${newStatus}`);
  }

  const roomTitle =
    room.title ||
    room.name ||
    (room.number ? `Room ${room.number}` : `${room.type || "Standard"} Room`);

  const roomNumberDisplay = room.number || room.roomNumber || room.id;

  const imagesList =
    Array.isArray(room.images) && room.images.length > 0
      ? room.images
      : room.image
      ? [room.image]
      : [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
        ];

  const amenitiesList = room.amenities || [
    "Free Wi-Fi",
    "Air Conditioning",
    "HD Flat Screen TV",
    "24/7 Room Service",
    "Private Luxury Bathroom",
    "Coffee & Tea Maker",
    "Work Desk",
    "Digital Safe",
  ];

  const defaultPolicies = [
    "Check-in from 2:00 PM onwards; express check-in available.",
    "Check-out by 11:00 AM; late check-out upon request.",
    "Free cancellation up to 48 hours prior to scheduled arrival.",
    "Non-smoking rooms. Dedicated smoking zones located on grounds.",
    "Pets welcomed upon prior concierge notification and approval.",
  ];

  const statusStyleMap = {
    Available: {
      bg: isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
      color: isDark ? "#4ade80" : "#166534",
      border: "rgba(34, 197, 94, 0.3)",
      dot: "#22c55e",
    },
    Occupied: {
      bg: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
      color: isDark ? "#f87171" : "#991b1b",
      border: "rgba(239, 68, 68, 0.3)",
      dot: "#ef4444",
    },
    Cleaning: {
      bg: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
      color: isDark ? "#fbbf24" : "#92400e",
      border: "rgba(245, 158, 11, 0.3)",
      dot: "#f59e0b",
    },
    Maintenance: {
      bg: isDark ? "rgba(148, 163, 184, 0.15)" : "#f1f5f9",
      color: isDark ? "#94a3b8" : "#475569",
      border: "rgba(148, 163, 184, 0.3)",
      dot: "#64748b",
    },
  };

  const currentStatusInfo =
    statusStyleMap[room.status] || statusStyleMap.Available;

  return (
    <div
      className="room-details-container"
      style={{
        color: isDark ? "#ffffff" : "#0f172a",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BREADCRUMB & BACK ROW
      ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <button
            type="button"
            onClick={() => navigate("/rooms")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "10px",
              background: isDark ? "#1e293b" : "#f1f5f9",
              color: isDark ? "#cbd5e1" : "#475569",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiArrowLeft style={{ fontSize: "15px" }} />
            <span>Rooms</span>
          </button>
          <span style={{ color: isDark ? "#64748b" : "#cbd5e1" }}>/</span>
          <span style={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: "600" }}>
            Room #{roomNumberDisplay}
          </span>
          <span style={{ color: isDark ? "#64748b" : "#cbd5e1" }}>/</span>
          <span style={{ color: isDark ? "#ffffff" : "#0f172a", fontWeight: "700" }}>
            {roomTitle}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setIsWishlisted(!isWishlisted)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 16px",
              borderRadius: "10px",
              background: isWishlisted
                ? isDark
                  ? "rgba(244, 63, 94, 0.15)"
                  : "#ffe4e6"
                : isDark
                ? "#1e293b"
                : "#ffffff",
              border: isWishlisted
                ? "1px solid rgba(244, 63, 94, 0.3)"
                : isDark
                ? "1px solid #334155"
                : "1px solid #e2e8f0",
              color: isWishlisted ? "#e11d48" : isDark ? "#cbd5e1" : "#475569",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <FiHeart style={{ fill: isWishlisted ? "#e11d48" : "none" }} />
            <span>{isWishlisted ? "Saved to Wishlist" : "Save Room"}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. HEADER TITLE & QUICK META ROW
      ───────────────────────────────────────────────────────────── */}
      <div
        className="room-details-header"
        style={{
          background: isDark ? "#1e293b" : "#ffffff",
          padding: "20px 24px",
          borderRadius: "18px",
          border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.25)"
            : "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#6366f1",
                background: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
                padding: "3px 10px",
                borderRadius: "999px",
                border: "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              {room.type || "Luxury Suite"}
            </span>

            <span
              style={{
                fontSize: "11.5px",
                fontWeight: "700",
                color: isDark ? "#cbd5e1" : "#475569",
                background: isDark ? "#0f172a" : "#f1f5f9",
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              Room #{roomNumberDisplay}
            </span>

            <span
              style={{
                fontSize: "11.5px",
                fontWeight: "600",
                color: isDark ? "#94a3b8" : "#64748b",
              }}
            >
              Floor {room.floor || 1} &bull; {room.roomView || "Courtyard View"}
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: "850",
              color: isDark ? "#ffffff" : "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            {roomTitle}
          </h1>
        </div>

        {/* Live Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: currentStatusInfo.bg,
              color: currentStatusInfo.color,
              border: `1px solid ${currentStatusInfo.border}`,
              fontSize: "12px",
              fontWeight: "750",
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: currentStatusInfo.dot,
                boxShadow: `0 0 8px ${currentStatusInfo.dot}`,
              }}
            />
            <span>{room.status || "Available"}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FULL HERO PHOTO GALLERY
      ───────────────────────────────────────────────────────────── */}
      <div
        className="room-details-gallery-card"
        style={{
          background: isDark ? "#1e293b" : "#ffffff",
          border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          padding: "14px",
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.25)"
            : "0 6px 20px rgba(0,0,0,0.03)",
        }}
      >
        <div className="room-featured-img-container">
          <img
            src={imagesList[activeImageIndex] || imagesList[0]}
            alt={roomTitle}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 0.3s ease, opacity 0.3s ease",
            }}
          />

          {/* Left & Right Carousel Arrows */}
          {imagesList.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev === 0 ? imagesList.length - 1 : prev - 1
                  )
                }
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(15, 23, 42, 0.75)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  zIndex: 5,
                  transition: "all 0.2s ease",
                }}
              >
                &#8249;
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev === imagesList.length - 1 ? 0 : prev + 1
                  )
                }
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(15, 23, 42, 0.75)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  zIndex: 5,
                  transition: "all 0.2s ease",
                }}
              >
                &#8250;
              </button>
            </>
          )}

          {/* Photo Counter Pill */}
          <span
            style={{
              position: "absolute",
              bottom: "14px",
              right: "14px",
              background: "rgba(15, 23, 42, 0.8)",
              color: "#ffffff",
              padding: "5px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "700",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              zIndex: 5,
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            📷 Photo {activeImageIndex + 1} of {imagesList.length}
          </span>
        </div>

        {/* Thumbnail Filmstrip */}
        {imagesList.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingTop: "12px",
              scrollbarWidth: "none",
            }}
          >
            {imagesList.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                style={{
                  position: "relative",
                  width: "90px",
                  height: "62px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
                  flexShrink: 0,
                  border:
                    activeImageIndex === idx
                      ? "3px solid #6366f1"
                      : "2px solid transparent",
                  boxShadow:
                    activeImageIndex === idx
                      ? "0 4px 12px rgba(99, 102, 241, 0.4)"
                      : "none",
                  opacity: activeImageIndex === idx ? 1 : 0.65,
                  transition: "all 0.2s ease",
                }}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TWO-COLUMN MAIN CONTENT & STICKY BOOKING SIDEBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="room-details-main-layout">
        {/* LEFT COLUMN: ROOM DETAILS & SPECS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* A. 4-UP QUICK SPECS CARD */}
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "16px",
              boxShadow: isDark
                ? "0 4px 20px rgba(0,0,0,0.2)"
                : "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <div className="room-specs-grid">
              {/* Spec 1: Guests */}
              <div
                className="room-spec-box"
                style={{
                  background: isDark ? "#0f172a" : "#f8fafc",
                  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                  }}
                >
                  <FiUsers />
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Max Guests
                </span>
                <strong style={{ fontSize: "13.5px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                  Up to {room.guests || 2} Guests
                </strong>
              </div>

              {/* Spec 2: Size */}
              <div
                className="room-spec-box"
                style={{
                  background: isDark ? "#0f172a" : "#f8fafc",
                  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                  }}
                >
                  <FiMaximize />
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Room Size
                </span>
                <strong style={{ fontSize: "13.5px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                  {room.sizeSqm || 36} m&sup2;
                </strong>
              </div>

              {/* Spec 3: Beds */}
              <div
                className="room-spec-box"
                style={{
                  background: isDark ? "#0f172a" : "#f8fafc",
                  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  <TbBed />
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Bed Setup
                </span>
                <strong style={{ fontSize: "13.5px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                  {room.beds || "1 King Bed"}
                </strong>
              </div>

              {/* Spec 4: Rating */}
              <div
                className="room-spec-box"
                style={{
                  background: isDark ? "#0f172a" : "#f8fafc",
                  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(234, 179, 8, 0.15)",
                    color: "#eab308",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                  }}
                >
                  <FiStar style={{ fill: "#eab308" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Guest Score
                </span>
                <strong style={{ fontSize: "13.5px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                  {room.rating || 4.7} / 5.0
                </strong>
              </div>
            </div>
          </div>

          {/* B. ROOM DESCRIPTION & HIGHLIGHTS */}
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: isDark
                ? "0 4px 20px rgba(0,0,0,0.2)"
                : "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                margin: "0 0 12px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiFileText style={{ color: "#6366f1" }} />
              About This Room
            </h2>

            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: isDark ? "#cbd5e1" : "#475569",
                margin: 0,
              }}
            >
              {room.description ||
                room.shortDescription ||
                "Indulge in sophisticated comfort. This room features plush designer bedding, elegant ambient lighting, an ergonomic work lounge, high-speed connectivity, and an expansive en-suite bath designed for complete relaxation."}
            </p>

            {/* Quick Feature Chips */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
              }}
            >
              {[
                "Daily Housekeeping",
                "Individually Controlled Climate",
                "Complimentary High-Speed Wi-Fi",
                "In-Room Gourmet Refreshments",
                "Soundproofed Architecture",
              ].map((perk, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11.5px",
                    fontWeight: "600",
                    color: isDark ? "#cbd5e1" : "#334155",
                    background: isDark ? "#0f172a" : "#f1f5f9",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                  }}
                >
                  <FiCheck style={{ color: "#10b981" }} />
                  {perk}
                </span>
              ))}
            </div>
          </div>

          {/* C. AMENITIES GRID */}
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: isDark
                ? "0 4px 20px rgba(0,0,0,0.2)"
                : "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                margin: "0 0 16px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiCoffee style={{ color: "#6366f1" }} />
              Room Amenities &amp; Conveniences
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              {amenitiesList.map((amenity, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    color: isDark ? "#cbd5e1" : "#334155",
                    fontWeight: "600",
                    background: isDark ? "#0f172a" : "#f8fafc",
                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      color: "#6366f1",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getAmenityIcon(amenity)}
                  </div>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* D. POLICIES & STAY RULES */}
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: isDark
                ? "0 4px 20px rgba(0,0,0,0.2)"
                : "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                margin: "0 0 16px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiClock style={{ color: "#6366f1" }} />
              Policies &amp; House Rules
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(room.policies && room.policies.length
                ? room.policies
                : defaultPolicies
              ).map((policy, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    background: isDark ? "#0f172a" : "#f8fafc",
                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: isDark ? "#cbd5e1" : "#475569",
                    lineHeight: "1.5",
                  }}
                >
                  <div
                    style={{
                      color: "#10b981",
                      marginTop: "2px",
                      fontSize: "15px",
                      flexShrink: 0,
                    }}
                  >
                    <FiCheckCircle />
                  </div>
                  <span>{policy}</span>
                </div>
              ))}
            </div>
          </div>

          {/* E. GUEST REVIEWS */}
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: isDark
                ? "0 4px 20px rgba(0,0,0,0.2)"
                : "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                margin: "0 0 14px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiStar style={{ color: "#f59e0b", fill: "#f59e0b" }} />
              Guest Reviews &amp; Ratings
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px",
                borderRadius: "14px",
                background: isDark ? "#0f172a" : "#f8fafc",
                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: isDark ? "#ffffff" : "#0f172a",
                  lineHeight: 1,
                }}
              >
                {room.rating || 4.7}
              </div>
              <div>
                <div style={{ display: "flex", gap: "3px", color: "#f59e0b", marginBottom: "3px" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar key={s} style={{ fill: "#f59e0b", fontSize: "14px" }} />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: "12.5px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Based on guest feedback across verified stays.
                </p>
              </div>
            </div>
          </div>

          {/* F. CURRENT ACTIVE GUEST & BOOKING CARD (PMS CONTROL) */}
          {booking && (
            <div
              style={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: "2px solid #6366f1",
                borderRadius: "18px",
                padding: "24px",
                boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "17px",
                    }}
                  >
                    <FiUser />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "800",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      Active Stay &amp; Guest Details
                    </h3>
                    <span style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                      Front Desk PMS Management
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {room.status === "Reserved" && (
                    <button
                      type="button"
                      onClick={handleCheckinBooking}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#10b981",
                        color: "#ffffff",
                        fontSize: "12.5px",
                        fontWeight: "750",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <FaCheck /> Mark Checked-In
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#ef4444",
                      color: "#ffffff",
                      fontSize: "12.5px",
                      fontWeight: "750",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <FaTimes /> Check-Out &amp; Release
                  </button>
                </div>
              </div>

              {/* Grid of Guest Booking Data */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "14px",
                  fontSize: "13px",
                  background: isDark ? "#0f172a" : "#f8fafc",
                  padding: "16px",
                  borderRadius: "14px",
                  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                }}
              >
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                    Guest Name
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: "14px" }}>
                    {booking.guestName}
                  </strong>
                </div>

                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                    Booking ID
                  </span>
                  <strong style={{ color: "#6366f1", fontSize: "13px" }}>
                    {booking.bookingId || "N/A"}
                  </strong>
                </div>

                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                    Check-In
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    {booking.checkIn}
                  </strong>
                </div>

                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                    Check-Out
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    {booking.checkOut}
                  </strong>
                </div>

                {booking.phone && (
                  <div>
                    <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                      Phone
                    </span>
                    <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                      {booking.phone}
                    </strong>
                  </div>
                )}

                {booking.email && (
                  <div>
                    <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                      Email
                    </span>
                    <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                      {booking.email}
                    </strong>
                  </div>
                )}

                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                    Payment Status
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "2px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: "750",
                      background:
                        booking.paymentStatus === "Paid" ||
                        booking.paymentStatus === "Paid In Full"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        booking.paymentStatus === "Paid" ||
                        booking.paymentStatus === "Paid In Full"
                          ? "#166534"
                          : "#991b1b",
                    }}
                  >
                    {booking.paymentStatus || "Pending"}
                    {booking.amountPaid
                      ? ` • ₹${Number(booking.amountPaid).toLocaleString("en-IN")}`
                      : ""}
                  </span>
                </div>

                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                    Booking Channel
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "2px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      background:
                        booking.source === "website" ? "#dbeafe" : "#f3e8ff",
                      color:
                        booking.source === "website" ? "#1e40af" : "#7e22ce",
                    }}
                  >
                    {booking.source === "website" ? "Website" : "Front Desk"}
                  </span>
                </div>
              </div>

              {/* Accompanying guests list */}
              {booking.guestList && booking.guestList.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: isDark
                      ? "1px solid #334155"
                      : "1px solid #e2e8f0",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "13.5px",
                      fontWeight: "750",
                      margin: "0 0 10px 0",
                      color: isDark ? "#ffffff" : "#0f172a",
                    }}
                  >
                    Accompanying Guests ({booking.guestList.length})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {booking.guestList.map((g, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: isDark ? "#0f172a" : "#f8fafc",
                          border: isDark
                            ? "1px solid #334155"
                            : "1px solid #e2e8f0",
                          fontSize: "12.5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                            {g.name}
                          </strong>
                          <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            ({g.relation || "Guest"})
                          </span>
                        </div>
                        {g.idType && (
                          <span style={{ color: "#6366f1", fontWeight: "600" }}>
                            {g.idType}: {g.idNumber}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY BOOKING & LIVE ACTION CONTROLLER */}
        <div className="room-sidebar-sticky">
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: isDark
                ? "0 10px 30px rgba(0,0,0,0.3)"
                : "0 8px 25px rgba(0,0,0,0.05)",
            }}
          >
            {/* Price Header */}
            <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#94a3b8" : "#64748b", display: "block", marginBottom: "4px" }}>
                Nightly Room Rate
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "30px",
                    fontWeight: "900",
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ₹{(room.price || 2500).toLocaleString("en-IN")}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                >
                  / night
                </span>
              </div>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                Includes all hotel taxes &middot; Gourmet breakfast included
              </p>
            </div>

            {/* Quick Live Status Dropdown */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "750",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: isDark ? "#94a3b8" : "#64748b",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Room Status &amp; Live Availability
              </label>
              <select
                value={room.status || "Available"}
                onChange={(e) => handleRoomStatusToggle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: isDark ? "#0f172a" : "#f8fafc",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <option value="Available">Available (Ready to Book)</option>
                <option value="Occupied">Occupied (Guest In-House)</option>
                <option value="Cleaning">Cleaning in Progress</option>
                <option value="Maintenance">Under Maintenance</option>
              </select>
            </div>

            {/* Primary Action Button */}
            {booking && !["Cleaning", "Available"].includes(room.status) ? (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  Occupied by {booking.guestName}
                </div>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "800",
                    background: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
                    transition: "transform 0.1s ease",
                  }}
                >
                  CHECK-OUT GUEST
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={
                  room.status === "Maintenance" || room.status === "Cleaning"
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                  background:
                    room.status === "Maintenance" || room.status === "Cleaning"
                      ? isDark
                        ? "#334155"
                        : "#cbd5e1"
                      : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#ffffff",
                  border: "none",
                  boxShadow:
                    room.status === "Maintenance" || room.status === "Cleaning"
                      ? "none"
                      : "0 6px 20px rgba(99, 102, 241, 0.4)",
                  cursor:
                    room.status === "Maintenance" || room.status === "Cleaning"
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {room.status === "Maintenance"
                  ? "Under Maintenance"
                  : room.status === "Cleaning"
                  ? "Cleaning in Progress"
                  : "BOOK THIS ROOM"}
              </button>
            )}

            {/* Peace of Mind & Hotel Guarantees */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "12px",
                color: isDark ? "#cbd5e1" : "#475569",
                background: isDark ? "#0f172a" : "#f8fafc",
                padding: "14px",
                borderRadius: "14px",
                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheckCircle style={{ color: "#10b981", fontSize: "15px" }} />
                <span>Free cancellation up to 48h prior</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheckCircle style={{ color: "#10b981", fontSize: "15px" }} />
                <span>Zero booking or hidden service fees</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheckCircle style={{ color: "#10b981", fontSize: "15px" }} />
                <span>Instant confirmation &amp; digital keycard</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheckCircle style={{ color: "#10b981", fontSize: "15px" }} />
                <span>Complimentary high-speed Wi-Fi</span>
              </div>
            </div>

            {/* Summary Room Info Specs */}
            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Room UID</span>
                <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                  {room.roomUid || room.id}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Floor</span>
                <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                  Floor {room.floor || 1}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>View</span>
                <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                  {room.roomView || "Courtyard View"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. BOOKING MODAL
      ───────────────────────────────────────────────────────────── */}
      <BookRoomModal
        room={room}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmBooking}
      />

      {/* ─────────────────────────────────────────────────────────────
          6. UNPAID CHECKOUT WARNING MODAL
      ───────────────────────────────────────────────────────────── */}
      {paymentWarningModal && (
        <div
          className="modal-backdrop"
          onClick={() => setPaymentWarningModal(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: "22px",
              maxWidth: "460px",
              width: "100%",
              padding: "26px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              textAlign: "center",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "26px",
              }}
            >
              <FaExclamationTriangle />
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "19px",
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
              }}
            >
              Payment Required Before Check-Out
            </h3>

            <p
              style={{
                margin: "0 0 16px",
                fontSize: "13.5px",
                color: isDark ? "#94a3b8" : "#64748b",
                lineHeight: 1.55,
              }}
            >
              Guest <strong>{paymentWarningModal.guestName}</strong> has an
              unpaid balance of{" "}
              <strong style={{ color: "#dc2626" }}>
                ₹
                {(
                  paymentWarningModal.totalBill || 2500
                ).toLocaleString("en-IN")}
              </strong>
              . Check-out can only be completed after collecting the full
              balance.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={handleCollectAndCheckout}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "750",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                }}
              >
                <PaymentWalletIcon color="#ffffff" size={18} /> Collect Payment
                &amp; Complete Check-Out
              </button>

              <button
                type="button"
                onClick={() => setPaymentWarningModal(null)}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: isDark ? "#0f172a" : "#ffffff",
                  color: isDark ? "#cbd5e1" : "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}