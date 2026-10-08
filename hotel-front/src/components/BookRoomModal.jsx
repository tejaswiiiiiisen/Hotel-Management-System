import { useState, useEffect } from "react";
import {
  FaTimes,
  FaCalendarAlt,
  FaUser,
  FaPhoneAlt,
  FaBed,
  FaCheckCircle,
  FaBookmark,
  FaIdCard,
  FaFileUpload,
  FaFileAlt,
  FaCreditCard,
  FaQrcode,
  FaUniversity,
  FaMoneyBillWave,
  FaArrowRight,
  FaArrowLeft,
  FaShieldAlt,
  FaClock,
  FaChevronDown,
  FaTag,
} from "react-icons/fa";
import { getUserName } from "../auth.js";
import { triggerBookingAlert } from "../services/notificationStore.js";
import { createBookingAPI } from "../services/bookingService.js";


export default function BookRoomModal({ room, isOpen, onClose, onConfirm, availableRooms = [], onRoomChange }) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000 * 2)
    .toISOString()
    .split("T")[0];

  // DYNAMIC DARK / LIGHT MODE DETECTOR
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  useEffect(() => {
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
  }, []);

  const isDark = theme === "dark";

  const themeStyles = {
    bgModal: isDark ? "#1e293b" : "#ffffff",
    headerBg: isDark ? "#0f172a" : "#ffffff",
    headerBorder: isDark ? "#334155" : "#f1f5f9",
    textPrimary: isDark ? "#f8fafc" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    labelColor: isDark ? "#cbd5e1" : "#334155",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputBorder: isDark ? "#334155" : "#cbd5e1",
    boxBg: isDark ? "#0f172a" : "#f8fafc",
    boxBorder: isDark ? "#334155" : "#e2e8f0",
    cardBg: isDark ? "#0f172a" : "#ffffff",
    cardBorder: isDark ? "#334155" : "#e2e8f0",
    infoBannerBg: isDark ? "rgba(102, 126, 234, 0.15)" : "#f0f3ff",
    infoBannerBorder: isDark ? "rgba(102, 126, 234, 0.3)" : "#c7d2fe",
    infoBannerText: isDark ? "#c7d2fe" : "#4338ca",
    voucherBg: isDark ? "rgba(168, 85, 247, 0.15)" : "#faf5ff",
    voucherBorder: isDark ? "rgba(168, 85, 247, 0.3)" : "#e9d5ff",
    voucherText: isDark ? "#d8b4fe" : "#7e22ce",
    closeBtnBg: isDark ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9",
    closeBtnColor: isDark ? "#cbd5e1" : "#64748b",
    primaryAccent: "#667eea",
  };

  const [step, setStep] = useState(1); // 1 = Details, 2 = Payment Selection, 3 = Payment Success
  const [guestName, setGuestName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(room?.guests || 2);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [docFile, setDocFile] = useState(null);

  // PAYMENT STATES
  const [paymentCategory, setPaymentCategory] = useState("wallet"); // "wallet" | "card" | "banking" | "cash"
  const [selectedSubMethod, setSelectedSubMethod] = useState("gpay"); // "gpay" | "phonepe" | "paytm" | "visa" | "sbi"
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!isOpen || !room) return null;

  const roomPrice = Number(room?.price || 2500);

  const calcNights = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays;
    } catch (e) {
      return 1;
    }
  };

  const nights = calcNights();
  const totalAmount = nights * roomPrice;

  function formatDateString(str) {
    if (!str) return "";
    const date = new Date(str);
    if (isNaN(date.getTime())) return str;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocFile({
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(1) + " KB",
        uploadedAt: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        url: reader.result,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleStep1Next(e) {
    e.preventDefault();
    if (new Date(checkOut) <= new Date(checkIn)) { setError("Check-out date must be after check-in date."); return; } if (!guestName.trim()) {
      setError("Please enter the guest full name");
      return;
    }
    setError("");
    setStep(2);
  }

  async function handleExecutePayment(e) {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      const randomId = `#B-${Math.floor(1000 + Math.random() * 9000)}`;
      const bookingData = {
        guestName: guestName.trim(),
        bookingId: randomId,
        roomNumber: room.number,
        roomType: room.type,
        roomPrice: roomPrice,
        checkIn: formatDateString(checkIn),
        checkOut: formatDateString(checkOut),
        phone: phone.trim() ? `${countryCode} ${phone.trim()}` : "",
        guests: Number(guests),
        notes: notes.trim(),
        document: docFile || null,
        totalBill: totalAmount,
        paidAmount:
          paymentCategory === "cash" && selectedSubMethod === "pay_later"
            ? 0
            : totalAmount,
        paymentStatus:
          paymentCategory === "cash" && selectedSubMethod === "pay_later"
            ? "Unpaid"
            : "Paid",
        paymentMethod: paymentCategory,
        subMethod: selectedSubMethod,
        _alreadyCreated: true,
      };

      const staffName = getUserName() || "Staff";
      const apiRes = await createBookingAPI({
        roomId: room.id,
        roomUid: room.roomUid || room.room_uid || undefined,
        roomName: room.name || `Room ${room.number}`,
        roomNumber: room.number,
        floor: room.floor || "1st Floor",
        roomView: room.roomView || "Standard View",
        checkInDate: formatDateString(checkIn),
        checkInTime: "02:00 PM",
        checkOutDate: formatDateString(checkOut),
        checkOutTime: "11:00 AM",
        nights: nights,
        days: nights + 1,
        guests: `${Number(guests)} Adults`,
        amountPaid: bookingData.paidAmount,
        nightlyRate: roomPrice,
        paymentMethod: paymentCategory === "wallet" ? "UPI" : paymentCategory === "card" ? "Credit Card" : paymentCategory === "banking" ? "Net Banking" : "Cash",
        image: room.image || (Array.isArray(room.images) && room.images[0]) || "",
        amenities: room.amenities || [],
        guestName: guestName.trim(),
        guestPhone: phone.trim() ? `${countryCode} ${phone.trim()}` : "",
        source: "dashboard",
        bookedBy: staffName,
      });

      if (apiRes && apiRes.bookingCode) {
        bookingData.bookingId = apiRes.bookingCode;
      }
      if (apiRes && apiRes.bookingId) {
        bookingData.pkId = apiRes.bookingId;
      }

      triggerBookingAlert(bookingData);
      setCreatedBooking(bookingData);
      setIsProcessing(false);
      setStep(3); // MOVE TO STEP 3: PAYMENT SUCCESSFUL UI
    } catch (err) {
      console.error("Backend booking failed:", err);
      setIsProcessing(false);
      setError(err.message || "Failed to book room. Please check dates and try again.");
    }
  }

  function handleFinishAndClose() {
    if (createdBooking && typeof onConfirm === "function") {
      onConfirm(createdBooking, true);
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          maxWidth: step === 3 ? "480px" : "540px",
          width: "100%",
          borderRadius: "24px",
          overflow: "hidden",
          background: themeStyles.bgModal,
          color: themeStyles.textPrimary,
          boxShadow: isDark
            ? "0 25px 60px -12px rgba(0, 0, 0, 0.7)"
            : "0 25px 60px -12px rgba(0, 0, 0, 0.25)",
          transition: "all 0.3s ease",
          border: isDark ? "1px solid #334155" : "none",
        }}
      >
        {/* MODAL HEADER (STEPS 1 & 2 ONLY) */}
        {step < 3 && (
          <div
            className="modal-header"
            style={{
              flexShrink: 0,
              padding: "18px 24px",
              background: themeStyles.headerBg,
              borderBottom: `1px solid ${themeStyles.headerBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: themeStyles.textPrimary,
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FaArrowLeft />
                </button>
              )}
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "800",
                  color: themeStyles.textPrimary,
                }}
              >
                {step === 1 ? `Book Room ${room.number}` : "Payment Method"}
              </h3>
            </div>
            <button
              className="modal-close-btn"
              onClick={onClose}
              type="button"
              style={{
                background: themeStyles.closeBtnBg,
                border: "none",
                color: themeStyles.closeBtnColor,
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* STEP 1: GUEST & STAY DETAILS FORM */}
        {step === 1 && (
          <form
            onSubmit={handleStep1Next}
            className="modal-body"
            style={{
              overflowY: "auto",
              flex: 1,
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* AVAILABLE ROOM SELECTOR DROPDOWN (IF TRIGGERED GLOBALLY) */}
            {availableRooms && availableRooms.length > 0 && (
              <div style={{ background: themeStyles.boxBg, padding: "12px 14px", borderRadius: "14px", border: `1px solid ${themeStyles.boxBorder}` }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", marginBottom: "6px", color: themeStyles.labelColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Select Available Room to Book
                </label>
                <select
                  value={room?.id}
                  onChange={(e) => {
                    const selected = availableRooms.find((r) => String(r.id) === e.target.value);
                    if (selected && onRoomChange) onRoomChange(selected);
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${themeStyles.inputBorder}`,
                    background: themeStyles.inputBg,
                    color: themeStyles.textPrimary,
                    fontSize: "13.5px",
                    fontWeight: "700",
                    outline: "none",
                  }}
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room #{r.number || r.roomNumber} - {r.type} (₹{Number(r.price || r.pricePerNight || 2500).toLocaleString("en-IN")} / night)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ROOM MULTI-PHOTO PREVIEW GALLERY BANNER */}
            {room && (
              <div style={{ borderRadius: "16px", overflow: "hidden", border: `1px solid ${themeStyles.boxBorder}`, background: themeStyles.boxBg }}>
                <div style={{ position: "relative", height: "160px", width: "100%" }}>
                  <img
                    src={(Array.isArray(room.images) && room.images[activePhotoIdx]) || room.image || (Array.isArray(room.images) && room.images[0]) || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"}
                    alt={room.name || `Room ${room.number}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", bottom: "10px", left: "12px", background: "rgba(15, 23, 42, 0.82)", color: "#ffffff", padding: "4px 12px", borderRadius: "999px", fontSize: "11.5px", fontWeight: "700", backdropFilter: "blur(4px)" }}>
                    Room #{room.number} • {room.type} • ₹{room.price?.toLocaleString("en-IN")}/night
                  </div>
                </div>

                {Array.isArray(room.images) && room.images.length > 1 && (
                  <div style={{ display: "flex", gap: "8px", padding: "10px 12px", overflowX: "auto" }}>
                    {room.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        onClick={() => setActivePhotoIdx(idx)}
                        style={{
                          width: "52px",
                          height: "38px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          cursor: "pointer",
                          border: activePhotoIdx === idx ? "2px solid #667eea" : "2px solid transparent",
                          opacity: activePhotoIdx === idx ? 1 : 0.6,
                          transition: "all 0.2s ease",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: isDark ? "rgba(220, 38, 38, 0.2)" : "#fef2f2",
                  border: isDark
                    ? "1px solid rgba(220, 38, 38, 0.4)"
                    : "1px solid #fecaca",
                  color: isDark ? "#fca5a5" : "#dc2626",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: themeStyles.labelColor,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaUser style={{ color: "#667eea" }} /> Guest Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setError("");
                }}
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: `1px solid ${themeStyles.inputBorder}`,
                  background: themeStyles.inputBg,
                  color: themeStyles.textPrimary,
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  outline: "none",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div className="form-group">
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: themeStyles.labelColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaPhoneAlt style={{ color: "#667eea" }} /> Mobile Number ({phone.length}/10)
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{
                      padding: "11px 10px",
                      border: `1px solid ${themeStyles.inputBorder}`,
                      background: themeStyles.inputBg,
                      color: themeStyles.textPrimary,
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: "700",
                      outline: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                      width: "102px",
                    }}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+65">🇸🇬 +65</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{
                      flex: 1,
                      width: "100%",
                      minWidth: 0,
                      padding: "11px 14px",
                      border: `1px solid ${themeStyles.inputBorder}`,
                      background: themeStyles.inputBg,
                      color: themeStyles.textPrimary,
                      borderRadius: "12px",
                      fontSize: "13.5px",
                      outline: "none",
                      letterSpacing: "0.04em",
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: themeStyles.labelColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaBed style={{ color: "#667eea" }} /> Number of Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    border: `1px solid ${themeStyles.inputBorder}`,
                    background: themeStyles.inputBg,
                    color: themeStyles.textPrimary,
                    borderRadius: "12px",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                >
                  {[...Array(room.guests || 4)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div className="form-group">
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: themeStyles.labelColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaCalendarAlt style={{ color: "#667eea" }} /> Check-In Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    border: `1px solid ${themeStyles.inputBorder}`,
                    background: themeStyles.inputBg,
                    color: themeStyles.textPrimary,
                    borderRadius: "12px",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              <div className="form-group">
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: themeStyles.labelColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaCalendarAlt style={{ color: "#667eea" }} /> Check-Out Date
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    border: `1px solid ${themeStyles.inputBorder}`,
                    background: themeStyles.inputBg,
                    color: themeStyles.textPrimary,
                    borderRadius: "12px",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* DOCUMENT UPLOADER */}
            <div className="form-group">
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: themeStyles.labelColor,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaIdCard style={{ color: "#667eea" }} /> Upload Guest Document /
                ID (Aadhar, Passport)
              </label>
              <div
                style={{
                  border: `2px dashed ${themeStyles.inputBorder}`,
                  borderRadius: "12px",
                  padding: "14px",
                  background: themeStyles.boxBg,
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                {docFile ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      background: themeStyles.cardBg,
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: `1px solid ${themeStyles.cardBorder}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <FaFileAlt
                        style={{
                          color: "#667eea",
                          fontSize: "18px",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontSize: "12.5px",
                            fontWeight: "700",
                            color: themeStyles.textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "230px",
                          }}
                        >
                          {docFile.name}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: themeStyles.textSecondary,
                          }}
                        >
                          {docFile.size} • {docFile.uploadedAt}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocFile(null);
                      }}
                      style={{
                        background: "#fee2e2",
                        border: "none",
                        color: "#ef4444",
                        borderRadius: "6px",
                        padding: "5px 9px",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    <FaFileUpload
                      style={{ fontSize: "22px", color: "#667eea" }}
                    />
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight: "700",
                        color: themeStyles.textPrimary,
                      }}
                    >
                      Click to upload Aadhar / Passport / ID Document
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: themeStyles.textSecondary,
                      }}
                    >
                      Accepts PDF, Images, DOC, PNG, JPG
                    </span>
                    <input
                      type="file"
                      accept="*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* SUMMARY BAR */}
            <div
              style={{
                background: themeStyles.boxBg,
                border: `1px solid ${themeStyles.boxBorder}`,
                borderRadius: "14px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "4px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: themeStyles.textSecondary,
                  }}
                >
                  Total Payment:
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    color: themeStyles.textPrimary,
                  }}
                >
                  ₹{totalAmount.toLocaleString("en-IN")}
                </div>
              </div>
              <button
                type="submit"
                style={{
                  padding: "12px 28px",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
                }}
              >
                Proceed
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PAYMENT METHOD SELECTION UI */}
        {step === 2 && (
          <form
            onSubmit={handleExecutePayment}
            className="modal-body"
            style={{
              overflowY: "auto",
              flex: 1,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* INFO ALERT BANNER */}
            <div
              style={{
                background: themeStyles.infoBannerBg,
                border: `1px solid ${themeStyles.infoBannerBorder}`,
                borderRadius: "14px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                color: themeStyles.infoBannerText,
                fontSize: "12.5px",
                lineHeight: "1.4",
              }}
            >
              <div
                style={{
                  background: "#667eea",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "800",
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              >
                i
              </div>
              <div>
                Select your preferred payment method below to complete room
                reservation for <strong>{guestName || "Guest"}</strong>.
              </div>
            </div>

            {/* ORDER / ROOM SUMMARY CARD */}
            <div
              style={{
                background: themeStyles.cardBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                borderRadius: "16px",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "800",
                    color: themeStyles.textPrimary,
                  }}
                >
                  Room Booking Summary
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: "none",
                    border: `1px solid ${themeStyles.cardBorder}`,
                    color: "#667eea",
                    borderRadius: "999px",
                    padding: "3px 12px",
                    fontSize: "11.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "12.5px",
                }}
              >
                <div>
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    Guest Name
                  </span>
                  <strong style={{ color: themeStyles.textPrimary }}>
                    {guestName}
                  </strong>
                </div>
                <div>
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    Room Booked
                  </span>
                  <strong style={{ color: themeStyles.textPrimary }}>
                    Room {room.number} ({room.type})
                  </strong>
                </div>
                <div>
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    Stay Dates
                  </span>
                  <strong style={{ color: themeStyles.textPrimary }}>
                    {checkIn} to {checkOut}
                  </strong>
                </div>
                <div>
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    Duration & Rate
                  </span>
                  <strong style={{ color: themeStyles.textPrimary }}>
                    {nights} Nights • ₹{roomPrice}/night
                  </strong>
                </div>
              </div>
            </div>

            {/* PAYMENT CATEGORIES LIST */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  color: themeStyles.textPrimary,
                }}
              >
                Select Payment Category:
              </span>

              {/* 1. E-WALLET / UPI DIGITAL */}
              <div
                style={{
                  border:
                    paymentCategory === "wallet"
                      ? "2px solid #667eea"
                      : `1px solid ${themeStyles.cardBorder}`,
                  borderRadius: "14px",
                  background:
                    paymentCategory === "wallet"
                      ? isDark
                        ? "rgba(102, 126, 234, 0.12)"
                        : "#f4f6ff"
                      : themeStyles.cardBg,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => setPaymentCategory("wallet")}
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: themeStyles.textPrimary,
                    }}
                  >
                    <FaQrcode style={{ color: "#667eea", fontSize: "18px" }} />
                    <span>E-Wallet & UPI Payment</span>
                  </div>
                  <FaChevronDown
                    style={{
                      fontSize: "12px",
                      color: themeStyles.textSecondary,
                      transform:
                        paymentCategory === "wallet"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>

                {paymentCategory === "wallet" && (
                  <div
                    style={{
                      padding: "0 16px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      borderTop: `1px solid ${themeStyles.cardBorder}`,
                      paddingTop: "12px",
                    }}
                  >
                    {[
                      {
                        id: "gpay",
                        label: "Google Pay / PhonePe UPI",
                        info: "hotel.matchatea@upi",
                      },
                      {
                        id: "paytm",
                        label: "Paytm Wallet / UPI",
                        info: "Instant scan QR code",
                      },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedSubMethod(item.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background:
                            selectedSubMethod === item.id
                              ? isDark
                                ? "rgba(102, 126, 234, 0.25)"
                                : "#eeefff"
                              : themeStyles.inputBg,
                          border:
                            selectedSubMethod === item.id
                              ? "1px solid #667eea"
                              : `1px solid ${themeStyles.cardBorder}`,
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: "700",
                              color: themeStyles.textPrimary,
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: themeStyles.textSecondary,
                            }}
                          >
                            {item.info}
                          </div>
                        </div>
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            border:
                              selectedSubMethod === item.id
                                ? "6px solid #667eea"
                                : `2px solid ${themeStyles.inputBorder}`,
                            background: themeStyles.bgModal,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. CREDIT / DEBIT CARD */}
              <div
                style={{
                  border:
                    paymentCategory === "card"
                      ? "2px solid #667eea"
                      : `1px solid ${themeStyles.cardBorder}`,
                  borderRadius: "14px",
                  background:
                    paymentCategory === "card"
                      ? isDark
                        ? "rgba(102, 126, 234, 0.12)"
                        : "#f4f6ff"
                      : themeStyles.cardBg,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => setPaymentCategory("card")}
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: themeStyles.textPrimary,
                    }}
                  >
                    <FaCreditCard
                      style={{ color: "#667eea", fontSize: "18px" }}
                    />
                    <span>Credit / Debit Card</span>
                  </div>
                  <FaChevronDown
                    style={{
                      fontSize: "12px",
                      color: themeStyles.textSecondary,
                      transform:
                        paymentCategory === "card"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>

                {paymentCategory === "card" && (
                  <div
                    style={{
                      padding: "0 16px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      borderTop: `1px solid ${themeStyles.cardBorder}`,
                      paddingTop: "12px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Card Number (4532 •••• •••• 8892)"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: `1px solid ${themeStyles.inputBorder}`,
                        background: themeStyles.inputBg,
                        color: themeStyles.textPrimary,
                        fontSize: "12.5px",
                      }}
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        style={{
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: `1px solid ${themeStyles.inputBorder}`,
                          background: themeStyles.inputBg,
                          color: themeStyles.textPrimary,
                          fontSize: "12.5px",
                        }}
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        style={{
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: `1px solid ${themeStyles.inputBorder}`,
                          background: themeStyles.inputBg,
                          color: themeStyles.textPrimary,
                          fontSize: "12.5px",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. NET BANKING */}
              <div
                style={{
                  border:
                    paymentCategory === "banking"
                      ? "2px solid #667eea"
                      : `1px solid ${themeStyles.cardBorder}`,
                  borderRadius: "14px",
                  background:
                    paymentCategory === "banking"
                      ? isDark
                        ? "rgba(102, 126, 234, 0.12)"
                        : "#f4f6ff"
                      : themeStyles.cardBg,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => setPaymentCategory("banking")}
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: themeStyles.textPrimary,
                    }}
                  >
                    <FaUniversity
                      style={{ color: "#667eea", fontSize: "18px" }}
                    />
                    <span>Bank Transfer / Net Banking</span>
                  </div>
                  <FaChevronDown
                    style={{
                      fontSize: "12px",
                      color: themeStyles.textSecondary,
                      transform:
                        paymentCategory === "banking"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>

                {paymentCategory === "banking" && (
                  <div
                    style={{
                      padding: "0 16px 14px",
                      borderTop: `1px solid ${themeStyles.cardBorder}`,
                      paddingTop: "12px",
                    }}
                  >
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: `1px solid ${themeStyles.inputBorder}`,
                        background: themeStyles.inputBg,
                        color: themeStyles.textPrimary,
                        fontSize: "13px",
                      }}
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India">
                        State Bank of India (SBI)
                      </option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 4. CASH AT DESK */}
              <div
                style={{
                  border:
                    paymentCategory === "cash"
                      ? "2px solid #667eea"
                      : `1px solid ${themeStyles.cardBorder}`,
                  borderRadius: "14px",
                  background:
                    paymentCategory === "cash"
                      ? isDark
                        ? "rgba(102, 126, 234, 0.12)"
                        : "#f4f6ff"
                      : themeStyles.cardBg,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => setPaymentCategory("cash")}
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: themeStyles.textPrimary,
                    }}
                  >
                    <FaMoneyBillWave
                      style={{ color: "#667eea", fontSize: "18px" }}
                    />
                    <span>Cash Payment at Counter</span>
                  </div>
                  <FaChevronDown
                    style={{
                      fontSize: "12px",
                      color: themeStyles.textSecondary,
                      transform:
                        paymentCategory === "cash"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* VOUCHER / DISCOUNT ROW */}
            <div
              style={{
                background: themeStyles.voucherBg,
                border: `1px solid ${themeStyles.voucherBorder}`,
                borderRadius: "12px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12.5px",
                color: themeStyles.voucherText,
                fontWeight: "600",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FaTag /> You have 1 active hotel discount voucher applied!
              </div>
              <span
                style={{
                  fontSize: "11px",
                  background: isDark ? "rgba(168, 85, 247, 0.25)" : "#f3e8ff",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontWeight: "700",
                }}
              >
                Saved ₹0
              </span>
            </div>

            {/* PAYMENT SUMMARY BREAKDOWN */}
            <div
              style={{
                padding: "8px 4px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "12.5px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: themeStyles.textSecondary,
                }}
              >
                <span>Room Stay Cost</span>
                <span style={{ color: themeStyles.textPrimary }}>
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: themeStyles.textSecondary,
                }}
              >
                <span>Taxes & Service Fees</span>
                <span style={{ color: "#16a34a", fontWeight: "700" }}>FREE</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: themeStyles.textPrimary,
                  fontWeight: "800",
                  fontSize: "15px",
                  paddingTop: "6px",
                  borderTop: `1px solid ${themeStyles.cardBorder}`,
                }}
              >
                <span>Total Payment</span>
                <span style={{ color: "#667eea" }}>
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
                  border: isDark ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid #fca5a5",
                  color: isDark ? "#fca5a5" : "#b91c1c",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* BOTTOM FIXED BAR & PROCEED BUTTON */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "6px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    color: themeStyles.textSecondary,
                    display: "block",
                  }}
                >
                  Total Amount
                </span>
                <span
                  style={{
                    fontSize: "17px",
                    fontWeight: "800",
                    color: themeStyles.textPrimary,
                  }}
                >
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  padding: "12px 34px",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.4)",
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                {isProcessing ? "Processing..." : "Proceed"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PAYMENT SUCCESSFUL UI */}
        {step === 3 && createdBooking && (
          <div
            style={{
              padding: "30px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              overflowY: "auto",
            }}
          >
            {/* 3D SEAL STARBURST CHECKMARK BADGE (PROJECT THEME) */}
            <div
              style={{
                width: "96px",
                height: "96px",
                marginBottom: "16px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="96" height="96" viewBox="0 0 100 100" fill="none">
                <path
                  d="M50 4L58.5 12.5L70.5 10L74.5 21.5L86.5 23.5L85.5 35.5L95 43.5L89.5 54.5L95 65.5L85.5 73.5L86.5 85.5L74.5 87.5L70.5 99L58.5 96.5L50 105L41.5 96.5L29.5 99L25.5 87.5L13.5 85.5L14.5 73.5L5 65.5L10.5 54.5L5 43.5L14.5 35.5L13.5 23.5L25.5 21.5L29.5 10L41.5 12.5L50 4Z"
                  fill="url(#sealGradModalTheme)"
                  filter="drop-shadow(0px 8px 16px rgba(102, 126, 234, 0.4))"
                />
                <path
                  d="M34 52L45 63L67 39"
                  stroke="#ffffff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient
                    id="sealGradModalTheme"
                    x1="5"
                    y1="4"
                    x2="95"
                    y2="105"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#818cf8" />
                    <stop offset="0.5" stopColor="#667eea" />
                    <stop offset="1" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* HEADLINE */}
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "800",
                color: themeStyles.textPrimary,
                margin: "0 0 8px",
              }}
            >
              Your order is made!
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: themeStyles.textSecondary,
                margin: "0 0 22px",
                lineHeight: "1.5",
                maxWidth: "340px",
              }}
            >
              Congratulations! Your room reservation has been successfully
              proceed, we will prepare your room as soon as possible!
            </p>

            {/* BOOKING SUMMARY CARD */}
            <div
              style={{
                width: "100%",
                background: themeStyles.boxBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                borderRadius: "18px",
                padding: "16px 18px",
                textAlign: "left",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                  paddingBottom: "12px",
                  borderBottom: `1px solid ${themeStyles.cardBorder}`,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  <FaBed />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      color: themeStyles.textPrimary,
                    }}
                  >
                    BOOKING ID {createdBooking.bookingId}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: themeStyles.textSecondary,
                    }}
                  >
                    Hotel Matcha Tea Room Service
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  fontSize: "12.5px",
                }}
              >
                <div>
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    Guest Name
                  </span>
                  <strong style={{ color: themeStyles.textPrimary }}>
                    {createdBooking.guestName}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    Room Reserved
                  </span>
                  <strong style={{ color: themeStyles.textPrimary }}>
                    Room {createdBooking.roomNumber} ({createdBooking.roomType})
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    Check-In & Out
                  </span>
                  <strong style={{ color: themeStyles.textPrimary }}>
                    {createdBooking.checkIn} - {createdBooking.checkOut}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    Total Amount Paid
                  </span>
                  <strong style={{ color: "#667eea", fontSize: "14px" }}>
                    ₹{createdBooking.totalBill?.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </div>

            {/* BOTTOM BUTTON */}
            <button
              type="button"
              onClick={handleFinishAndClose}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "999px",
                border: "none",
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(102, 126, 234, 0.4)",
              }}
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
