import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiTag,
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
} from "react-icons/fi";
import { TbBed } from "react-icons/tb";
import {
  FaArrowLeft,
  FaBed,
  FaUser,
  FaWifi,
  FaCheckCircle,
  FaCalendarAlt,
  FaIdCard,
  FaCalendarPlus,
  FaTimes,
  FaExclamationTriangle,
  FaUserTie,
} from "react-icons/fa";
import PaymentWalletIcon from "../components/PaymentWalletIcon.jsx";
import BookRoomModal from "../components/BookRoomModal.jsx";
import {
  getRooms,
  fetchRoomsFromApi,
  fetchRoomsFromAPI,
  bookRoomInStore,
  bookRoomWithAPI,
  cancelBookingWithAPI,
  cancelBookingInStore,
  checkinBookingWithAPI,
  updateRoomInApi,
} from "../utils/roomStore.js";
import {
  getCustomers,
  updateCustomerPaymentAPI,
} from "../utils/customerStore.js";
import { fetchAllBookings } from "../services/bookingService.js";
import { getUserName } from "../auth.js";

export default function RoomDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [roomsList, setRoomsList] = useState(getRooms);
  const [apiBooking, setApiBooking] = useState(null); // booking from the API
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
        const match = bookings.find(
          (b) => b.roomId === Number(id) || b.roomNumber === String(id)
        );

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
          (b) => b.status === "Active Stay" || b.status === "Occupied"
        ) || combined.find(
          (b) => b.status === "Confirmed" || b.status === "Reserved"
        );

        setApiBooking(activeMatch || null);
      }
    } catch {
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
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2 style={{ color: isDark ? "#ffffff" : "#0f172a" }}>Room not found</h2>
        <button
          className="btn-primary"
          onClick={() => navigate("/rooms")}
          style={{
            marginTop: "16px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#ffffff",
            padding: "10px 24px",
            borderRadius: "999px",
            border: "none",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Back to Rooms
        </button>
      </div>
    );
  }

  // Merge local booking with API booking
  const booking = room.booking || (apiBooking ? {
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
  } : null);

  async function handleConfirmBooking(bookingData) {
    const staffName = getUserName() || "Staff";
    const updated = await bookRoomWithAPI(room, bookingData, staffName);
    setRoomsList(updated);
    loadData(); // refresh API data
  }

  async function handleCheckinBooking() {
    if (!booking) return;

    try {
      const validBookingPkId = booking.pkId || booking.id || apiBooking?.pkId || apiBooking?.id;

      // Call the checkin API
      const updatedRooms = await checkinBookingWithAPI(room.id, validBookingPkId);
      
      // Optimistic local update
      const matchedRoom = updatedRooms.find((r) => String(r.id) === String(room.id) || String(r.number) === String(room.number));
      if (matchedRoom) {
        setRoomsList(updatedRooms);
      }

      addNotification({
        user: "System",
        action: "checked in a booking",
        target: `Room ${room.number || room.id}`,
        message: `✅ Guest checked into Room ${room.number || room.id}. Status changed to Occupied.`,
        category: "Success",
        type: "success",
      });

      toast.success("Checked in successfully!");
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to check in.");
    }
  }

  async function handleCancelBooking() {
    if (!booking) return;

    // Check customer payment status
    const customers = getCustomers();
    const guestNameLower = (booking.guestName || "").trim().toLowerCase();
    const customer = customers.find(
      (c) => c.name.trim().toLowerCase() === guestNameLower
    );

    const isPaid = customer ? customer.paymentStatus === "Paid" : (booking.paymentStatus === "Paid" || booking.paymentStatus === "Paid In Full");

    const validBookingPkId = booking.pkId || booking.id || apiBooking?.pkId || apiBooking?.id;

    if (!isPaid) {
      setPaymentWarningModal({
        guestName: booking.guestName,
        totalBill: customer ? customer.totalBill : (booking.amountPaid || room.price * 2),
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
        toast.success("Checked out successfully.");
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error(err.message || "Checkout failed");
      }
    }
  }

  async function handleCollectAndCheckout() {
    try {
      if (paymentWarningModal?.customerId) {
        await updateCustomerPaymentAPI(paymentWarningModal.customerId, "Paid", paymentWarningModal.totalBill);
      }
      const updated = await cancelBookingWithAPI(room.id, paymentWarningModal?.bookingPkId);
      setRoomsList(updated);
      setApiBooking(null);
      setPaymentWarningModal(null);
      toast.success("Payment collected and checked out!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to process payment and checkout");
    }
  }

  async function handleRoomStatusToggle(newStatus) {
    const isAvailable = newStatus.toLowerCase() === "available" || newStatus.toLowerCase() === "cleaning";
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
  }

  const roomTitle =
    room.title || room.name || (room.number ? `Room ${room.number}` : `${room.type || "Standard"} Room`);

  const imagesList = Array.isArray(room.images) && room.images.length > 0
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
    "WiFi",
    "Air conditioning",
    "TV",
    "Minibar",
    "Work desk",
  ];

  const defaultPolicies = [
    "Check-in from 2:00 PM, check-out by 11:00 AM.",
    "Free cancellation up to 48 hours before arrival.",
    "No smoking inside room. Pets allowed on request.",
  ];

  return (
    <div
      className="room-details-container"
      style={{
        color: isDark ? "#ffffff" : "#0f172a",
      }}
    >
      {/* BREADCRUMB & BACK LINK */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          color: isDark ? "#94a3b8" : "#64748b",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/rooms"
          style={{
            color: isDark ? "#a5b4fc" : "#6366f1",
            textDecoration: "none",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <FiArrowLeft /> Rooms
        </Link>
        <span>&rsaquo;</span>
        <span
          style={{
            color: isDark ? "#cbd5e1" : "#475569",
            fontWeight: "500",
          }}
        >
          {roomTitle}
        </span>
      </div>

      {/* UNIFIED HERO CARD (MULTI-PHOTO GALLERY LEFT + PAYMENT/BOOKING RIGHT IN ONE CARD) */}
      <div
        className="room-hero-card"
        style={{
          background: isDark ? "#1e293b" : "#ffffff",
          border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          boxShadow: isDark
            ? "0 20px 50px rgba(0,0,0,0.3)"
            : "0 14px 34px rgba(31, 34, 51, 0.06)",
        }}
      >
        <div className="room-hero-grid">
          {/* HERO MULTI-PHOTO GALLERY (3/4 SPACE) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            {/* MAIN FEATURED PHOTO WITH ARROWS */}
            <div className="room-featured-img-container">
              <img
                src={imagesList[activeImageIndex] || imagesList[0]}
                alt={roomTitle}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "opacity 0.3s ease",
                }}
              />

              {/* LEFT / RIGHT NAV ARROWS */}
              {imagesList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1))}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "rgba(15, 23, 42, 0.75)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      backdropFilter: "blur(6px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      zIndex: 5,
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1))}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "rgba(15, 23, 42, 0.75)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      backdropFilter: "blur(6px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      zIndex: 5,
                    }}
                  >
                    ›
                  </button>
                </>
              )}

              {/* PHOTO COUNTER BADGE */}
              <span
                style={{
                  position: "absolute",
                  bottom: "14px",
                  right: "14px",
                  background: "rgba(15, 23, 42, 0.85)",
                  color: "#ffffff",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: "700",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  zIndex: 5,
                }}
              >
                📷 Photo {activeImageIndex + 1} of {imagesList.length}
              </span>

              {/* STATUS BADGE (MATCHING POPULAR BADGE STYLE, NO DOT) */}
              <span
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  padding: "4px 14px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.03em",
                  boxShadow:
                    room.status === "Available"
                      ? "0 4px 12px rgba(34, 197, 94, 0.25)"
                      : room.status === "Occupied"
                      ? "0 4px 12px rgba(239, 68, 68, 0.25)"
                      : "0 4px 12px rgba(0, 0, 0, 0.1)",
                  background:
                    room.status === "Available"
                      ? "#dcfce7"
                      : room.status === "Occupied"
                      ? "#fee2e2"
                      : room.status === "Cleaning"
                      ? "#fef3c7"
                      : "#f1f5f9",
                  color:
                    room.status === "Available"
                      ? "#166534"
                      : room.status === "Occupied"
                      ? "#991b1b"
                      : room.status === "Cleaning"
                      ? "#92400e"
                      : "#334155",
                  zIndex: 5,
                }}
              >
                {room.status || "Available"}
              </span>
            </div>

            {/* SIDEBAR THUMBNAIL GALLERY STRIP */}
            {imagesList.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  overflowX: "auto",
                  padding: "4px 2px 8px",
                  scrollbarWidth: "thin",
                }}
              >
                {imagesList.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      position: "relative",
                      width: "90px",
                      height: "64px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                      border: activeImageIndex === idx ? "3px solid #6366f1" : "2px solid transparent",
                      boxShadow: activeImageIndex === idx ? "0 4px 14px rgba(99, 102, 241, 0.45)" : "none",
                      opacity: activeImageIndex === idx ? 1 : 0.6,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAYMENT & BOOKING CARD CONTENT (1/4 SPACE) */}
          <div
            className="room-booking-sidebar-box"
            style={{
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: "220px",
            }}
          >
            {/* PRICE HEADER */}
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  color: isDark ? "#ffffff" : "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                ₹{(room.price || 2500).toLocaleString("en-IN")}
              </span>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: isDark ? "#94a3b8" : "#94a3b8",
                  marginLeft: "6px",
                }}
              >
                / night
              </span>
            </div>

            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "12.5px",
                color: isDark ? "#94a3b8" : "#64748b",
              }}
            >
              Incl. taxes &middot; gourmet breakfast
            </p>

            {/* BOOK / CHECK-OUT BUTTON */}
            {booking ? (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    textAlign: "center",
                    marginBottom: "12px",
                  }}
                >
                  Occupied by {booking.guestName}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCancelBooking}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "14px",
                    fontSize: "13px",
                    fontWeight: "800",
                    background: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  CHECK-OUT GUEST
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontWeight: "800",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "24px",
                }}
              >
                BOOK NOW
              </button>
            )}

            {/* ADMIN QUICK STATUS CHANGE SELECTOR */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#94a3b8" : "#64748b", display: "block", marginBottom: "6px" }}>
                Room Status & Availability
              </label>
              <select
                value={room.status || "Available"}
                onChange={(e) => handleRoomStatusToggle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: isDark ? "#0f172a" : "#f8fafc",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* GUARANTEES LIST */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "13px",
                color: isDark ? "#cbd5e1" : "#475569",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheck style={{ color: "#6366f1", fontSize: "16px" }} />
                <span>Free cancellation (48h)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheck style={{ color: "#6366f1", fontSize: "16px" }} />
                <span>No booking fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN DETAILS AREA CARD */}
      <div
        className="room-main-details-card"
        style={{
          background: isDark ? "#1e293b" : "#ffffff",
          border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          boxShadow: isDark
            ? "0 20px 50px rgba(0,0,0,0.3)"
            : "0 14px 34px rgba(31, 34, 51, 0.06)",
        }}
      >
        {/* ROOM TYPE TAG & WISHLIST ROW */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: isDark ? "#a5b4fc" : "#4f46e5",
              textTransform: "capitalize",
              background: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
              padding: "4px 12px",
              borderRadius: "999px",
            }}
          >
            {room.type}
          </span>

          <button
            type="button"
            onClick={() => setIsWishlisted(!isWishlisted)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: isWishlisted
                ? isDark ? "rgba(243, 244, 246, 0.1)" : "#fff1f2"
                : isDark ? "rgba(243, 244, 246, 0.05)" : "#f1f5f9",
              border: "none",
              color: isWishlisted ? "#ef4444" : isDark ? "#cbd5e1" : "#475569",
              padding: "8px 16px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <FiHeart style={{ fill: isWishlisted ? "#ef4444" : "none" }} />
            {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
          </button>
        </div>

        {/* ROOM TITLE */}
        <h1
          className="room-title-heading"
          style={{
            fontSize: "32px",
            fontWeight: "900",
            color: isDark ? "#ffffff" : "#0f172a",
            margin: "0 0 16px 0",
            letterSpacing: "-0.02em",
          }}
        >
          {roomTitle}
        </h1>

        {/* META SPECS ROW (GUESTS, SIZE, BEDS, RATING) */}
        <div
          className="room-meta-specs-row"
          style={{
            fontSize: "13.5px",
            color: isDark ? "#cbd5e1" : "#475569",
            fontWeight: "600",
            marginBottom: "24px",
            background: isDark ? "rgba(15, 23, 42, 0.6)" : "#f8fafc",
            border: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
            borderRadius: "16px",
            padding: "16px 20px",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <FiUsers style={{ color: "#6366f1" }} />
            Up to {room.guests || 2} guests
          </span>

          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <FiMaximize style={{ color: "#6366f1" }} />
            {room.sizeSqm || 40} m&sup2;
          </span>

          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <TbBed style={{ color: "#6366f1", fontSize: "16px" }} />
            {room.beds || "1 King Bed"}
          </span>

          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <FiStar style={{ color: "#f59e0b", fill: "#f59e0b" }} />
            {room.rating || 4.7} (0 reviews)
          </span>
        </div>

        {/* SHORT DESCRIPTION */}
        <p
          style={{
            fontSize: "14.5px",
            lineHeight: "1.6",
            color: isDark ? "#cbd5e1" : "#475569",
            marginBottom: "32px",
          }}
        >
          {room.shortDescription ||
            "Perfect for friends or small families with double queen beds, quiet atmosphere, and dedicated workspace."}
        </p>

        {/* AMENITIES SECTION */}
        <div style={{ marginBottom: "32px", paddingTop: "24px", borderTop: isDark ? "1px solid #334155" : "1px solid #f1f5f9" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: isDark ? "#ffffff" : "#0f172a",
              margin: "0 0 16px 0",
            }}
          >
            Amenities
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {amenitiesList.map((amenity, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13.5px",
                  color: isDark ? "#cbd5e1" : "#334155",
                  fontWeight: "500",
                  background: isDark ? "rgba(15, 23, 42, 0.5)" : "#f8fafc",
                  border: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
                  borderRadius: "12px",
                  padding: "10px 14px",
                }}
              >
                <FiCheck style={{ color: "#6366f1", fontSize: "16px", flexShrink: 0 }} />
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* POLICIES SECTION */}
        <div style={{ marginBottom: "32px", paddingTop: "24px", borderTop: isDark ? "1px solid #334155" : "1px solid #f1f5f9" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: isDark ? "#ffffff" : "#0f172a",
              margin: "0 0 16px 0",
            }}
          >
            Policies
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "13.5px",
              color: isDark ? "#cbd5e1" : "#475569",
              lineHeight: "1.5",
            }}
          >
            {(room.policies && room.policies.length ? room.policies : defaultPolicies).map(
              (policy, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    background: isDark ? "rgba(15, 23, 42, 0.5)" : "#f8fafc",
                    border: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
                    borderRadius: "12px",
                    padding: "10px 14px",
                  }}
                >
                  <span style={{ color: "#6366f1", fontWeight: "bold" }}>&bull;</span>
                  <span>{policy}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* GUEST REVIEWS SECTION */}
        <div style={{ paddingTop: "24px", borderTop: isDark ? "1px solid #334155" : "1px solid #f1f5f9" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: isDark ? "#ffffff" : "#0f172a",
              margin: "0 0 12px 0",
            }}
          >
            Guest reviews
          </h2>

          <p
            style={{
              fontSize: "13.5px",
              color: isDark ? "#94a3b8" : "#64748b",
              margin: 0,
            }}
          >
            No reviews yet &mdash; be the first to stay and share your experience.
          </p>
        </div>

        {/* ACTIVE BOOKING / GUEST DETAILS CARD (ADMIN PANEL CONTROL) */}
        {booking && (
          <div
            style={{
              background: isDark ? "#0f172a" : "#f8fafc",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "24px",
              marginTop: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "800",
                  color: isDark ? "#ffffff" : "#0f172a",
                }}
              >
                Current Guest Booking Details
              </h3>

              <div style={{ display: "flex", gap: "10px" }}>
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
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FaCheck /> Mark as Checked-In
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
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaTimes /> Check-Out &amp; Release Room
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                fontSize: "13px",
              }}
            >
              <div>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                  Guest Name
                </span>
                <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                  {booking.guestName}
                </strong>
              </div>

              <div>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                  Booking ID
                </span>
                <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                  {booking.bookingId || "N/A"}
                </strong>
              </div>

              <div>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                  Check In
                </span>
                <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                  {booking.checkIn}
                </strong>
              </div>

              <div>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                  Check Out
                </span>
                <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                  {booking.checkOut}
                </strong>
              </div>

              {booking.phone && (
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                    Phone
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    {booking.phone}
                  </strong>
                </div>
              )}

              {booking.email && (
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                    Email
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    {booking.email}
                  </strong>
                </div>
              )}

              {booking.paymentStatus && (
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                    Payment Status
                  </span>
                  <strong style={{ color: (booking.paymentStatus === "Paid" || booking.paymentStatus === "Paid In Full") ? "#16a34a" : "#dc2626" }}>
                    {booking.paymentStatus}
                    {booking.amountPaid ? ` — ₹${Number(booking.amountPaid).toLocaleString("en-IN")}` : ""}
                  </strong>
                </div>
              )}

              {booking.paymentMethod && (
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                    Payment Method
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    {booking.paymentMethod}
                  </strong>
                </div>
              )}

              {booking.source && (
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                    Booking Source
                  </span>
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "700",
                    background: booking.source === "website" ? "#dcfce7" : "#f3e8ff",
                    color: booking.source === "website" ? "#166534" : "#7e22ce",
                    display: "inline-block",
                    marginTop: "2px",
                  }}>
                    {booking.source === "website" ? "Website" : "Dashboard"}
                  </span>
                </div>
              )}

              {booking.bookedBy && (
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                    Booked By
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    {booking.bookedBy}
                  </strong>
                </div>
              )}

              {booking.nights && (
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                    Stay Duration
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    {booking.nights} Night{booking.nights > 1 ? "s" : ""}
                  </strong>
                </div>
              )}

              {booking.guests && (
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                    Guests
                  </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    {booking.guests}
                  </strong>
                </div>
              )}

              <div>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                  Identity Proof / Document
                </span>
                <strong>
                  {booking.document ? (
                    <span style={{ color: "#4f46e5", fontWeight: "700" }}>
                      📄 {booking.document.name}
                    </span>
                  ) : (
                    <span style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Not Attached</span>
                  )}
                </strong>
              </div>
            </div>

            {/* Guest List from API */}
            {booking.guestList && booking.guestList.length > 0 && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: isDark ? "1px solid #334155" : "1px solid #e2e8f0" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: isDark ? "#ffffff" : "#334155" }}>
                  Accompanying Guests ({booking.guestList.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {booking.guestList.map((g, idx) => (
                    <div key={idx} style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: isDark ? "#1e293b" : "#f8fafc",
                      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}>
                      <span style={{ fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>{g.name}</span>
                      <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>{g.relation}</span>
                      {g.idType && <span style={{ color: "#667eea", fontWeight: "600" }}>{g.idType}: {g.idNumber}</span>}
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontWeight: "700",
                        background: g.idStatus?.includes("Verified") ? "#dcfce7" : "#fef3c7",
                        color: g.idStatus?.includes("Verified") ? "#166534" : "#92400e",
                      }}>{g.idStatus || "Pending"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOOKING MODAL */}
      <BookRoomModal
        room={room}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmBooking}
      />

      {/* UNPAID CHECKOUT WARNING MODAL */}
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
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
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
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "460px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "24px",
              }}
            >
              <FaExclamationTriangle />
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "18px",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              Payment Required Before Check-Out
            </h3>

            <p
              style={{
                margin: "0 0 16px",
                fontSize: "13.5px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Guest <strong>{paymentWarningModal.guestName}</strong> has an unpaid balance of{" "}
              <strong style={{ color: "#dc2626" }}>
                &rArr;{(paymentWarningModal.totalBill || 2500).toLocaleString("en-IN")}
              </strong>
              . Check-out is strictly allowed only after payment is completed.
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
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
              >
                <PaymentWalletIcon color="#ffffff" size={18} /> Collect Payment &amp; Complete Check-Out
              </button>

              <button
                type="button"
                onClick={() => setPaymentWarningModal(null)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
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