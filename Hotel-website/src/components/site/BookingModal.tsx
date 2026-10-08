import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiPhone,
  FiHome,
  FiCalendar,
  FiCreditCard,
  FiUploadCloud,
  FiX,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiLayers,
  FiGrid,
  FiLock,
  FiCheck,
} from "react-icons/fi";
import { apiFetch } from "../../lib/api";
import type { User } from "../../types";
import { COUNTRY_PHONE_RULES, getPhoneRule, phoneRuleMessage } from "../../data/countryPhoneRules";

interface BookingModalProps {
  onClose: () => void;
  room?: any;
  roomName?: string;
  roomNumber?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
  pricePerNight?: number;
}

export default function BookingModal({
  onClose,
  room,
  roomName = "Room 101",
  roomNumber = "101",
  initialCheckIn,
  initialCheckOut,
  initialGuests = "2 Guests",
  pricePerNight = 2500,
}: BookingModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step state: "form" -> "payment" -> "success"
  const [step, setStep] = useState<"form" | "payment" | "success">("form");

  // Form states
  const [guestName, setGuestName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [country, setCountry] = useState("India");
  const [guestCount, setGuestCount] = useState(initialGuests);
  const [floorNo, setFloorNo] = useState("1st Floor");
  const [roomNo, setRoomNo] = useState(roomNumber || "101");

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking" | "hotel">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  // Default dates: Today and 2 days later if not provided
  const todayStr = new Date().toISOString().split("T")[0];
  const dayAfterTwo = new Date(Date.now() + 2 * 86400000)
    .toISOString()
    .split("T")[0];

  const [checkIn, setCheckIn] = useState(initialCheckIn || todayStr);
  const [checkOut, setCheckOut] = useState(initialCheckOut || dayAfterTwo);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const phoneRule = getPhoneRule(countryCode);
  const [successData, setSuccessData] = useState<{
    bookingCode: string;
    totalPaid: number;
    paymentMethodUsed: string;
  } | null>(null);

  // Calculate total nights and price
  const calculateTotal = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const nights = diffDays > 0 ? diffDays : 1;
      return nights * pricePerNight;
    } catch {
      return 5000;
    }
  };

  const totalPrice = calculateTotal();

  // Load user data to pre-fill name/phone
  useEffect(() => {
    let active = true;
    if (sessionStorage.getItem("user_logged_in") !== "true") return;
    apiFetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && d.user) {
          setUser(d.user);
          if (d.user.name) setGuestName(d.user.name);
          if (d.user.phone) setPhone(d.user.phone);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Step 1 Proceed -> Go to Payment Step
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !gender) {
      setErrorMsg("Please enter the guest's full name.");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < phoneRule.min || phoneDigits.length > phoneRule.max) {
      setErrorMsg(phoneRuleMessage(phoneRule));
      return;
    }
    setErrorMsg("");
    setStep("payment");
  };

  // Step 2 Submit -> Complete Booking
  const handleFinalPaymentSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = d2.getTime() - d1.getTime();
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Format dates nicely for display
    const formatDisplayDate = (dStr: string) => {
      const d = new Date(dStr);
      return isNaN(d.getTime())
        ? dStr
        : d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
    };

    let paymentMethodText = "UPI Instant Payment";
    if (paymentMethod === "card") paymentMethodText = `Credit/Debit Card (${cardNumber ? "•••• " + cardNumber.slice(-4) : "Visa/Mastercard"})`;
    else if (paymentMethod === "netbanking") paymentMethodText = `Net Banking (${selectedBank})`;
    else if (paymentMethod === "hotel") paymentMethodText = "Pay at Hotel (Cash/Card on Check-in)";

    const bookingPayload = {
      roomId: roomNo ? Number(roomNo) : undefined,
      roomName: roomName.startsWith("Room") || roomName.startsWith("Suite") ? roomName : `Room ${roomNo || roomNumber} - ${roomName}`,
      roomNumber: roomNo || roomNumber || "101",
      floor: floorNo || "1st Floor",
      roomView: "Deluxe View",
      location: "Hotel Grand Resort",
      checkInDate: formatDisplayDate(checkIn),
      checkInTime: "02:00 PM",
      checkOutDate: formatDisplayDate(checkOut),
      checkOutTime: "11:00 AM",
      nights: nights,
      days: nights + 1,
      guests: guestCount,
      amountPaid: totalPrice,
      nightlyRate: pricePerNight,
      paymentMethod: paymentMethodText,
      image: "/images/rooms/room-1.avif",
      amenities: ["Free Wi-Fi", "Air Conditioning", "Breakfast Included"],
      guestName: guestName.trim(),
      gender,
      guestPhone: `${countryCode} ${phone.trim()}`,
      country,
      guestEmail: `${guestName.trim().toLowerCase().replace(/\s+/g, "")}@mail.com`,
      orgId: "CH560",
      guestList: [
        {
          name: guestName,
          relation: "Primary Guest",
          idType: "Aadhaar / Passport",
          idNumber: "XXXX-XXXX-1234",
          idStatus: "Uploaded & Verified",
          idDocName: selectedFile ? selectedFile.name : "Aadhaar_Document.pdf",
        },
      ],
    };

    try {
      const res = await apiFetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      const data = await res.json();
      if (res.ok) {
        // Sync customer to localStorage for Admin Panel Customers & Billing tab
        try {
          const newCustomerObj = {
            id: `C-${Math.floor(100 + Math.random() * 900)}`,
            name: guestName.trim(),
            username: `@${guestName.trim().toLowerCase().replace(/\s+/g, "")}`,
            gender,
            phone: `${countryCode} ${phone.trim()}`,
            email: `${guestName.trim().toLowerCase().replace(/\s+/g, "")}@mail.com`,
            bookings: 1,
            amount: `₹${totalPrice.toLocaleString("en-IN")}`,
            tier: "Daily Guest",
            tierColor: "#64748b",
            tierBg: "#f1f5f9",
            tierIcon: "👤",
            points: "0",
            stays: 1,
            lastVisit: formatDisplayDate(checkIn),
            status: "Active",
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            roomBooked: roomNo ? `Room ${roomNo}` : (roomNumber ? `Room ${roomNumber}` : "Room 101"),
            checkIn: formatDisplayDate(checkIn),
            checkOut: formatDisplayDate(checkOut),
            stayDays: nights,
            guestsCount: Number(guestCount) || 1,
            totalBill: totalPrice,
            paidAmount: totalPrice,
            paymentStatus: "Paid",
            invoiceId: `INV-CH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            document: selectedFile ? { fileName: selectedFile.name, status: "Uploaded & Verified" } : null,
          };

          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.includes("hotel_customers_data")) {
              const stored = localStorage.getItem(k);
              if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                  localStorage.setItem(k, JSON.stringify([newCustomerObj, ...parsed.filter((c: any) => c.name !== newCustomerObj.name)]));
                }
              }
            }
          }
        } catch (e) {
          console.warn("Failed updating local storage customers in BookingModal:", e);
        }

        // Dispatch real-time booking toast alert for Admin Dashboard
        try {
          const toastPayload = {
            id: Date.now(),
            bookingCode: data.bookingCode || `RES-${Math.floor(10000 + Math.random() * 90000)}`,
            roomNumber: roomNo || roomNumber || "101",
            roomName: roomName.startsWith("Room") ? roomName : `Room ${roomNo || roomNumber} - ${roomName}`,
            guestName: guestName.trim(),
            checkInDate: formatDisplayDate(checkIn),
            checkOutDate: formatDisplayDate(checkOut),
            amountPaid: totalPrice,
            paymentMethod: paymentMethodText,
            orgId: "CH560",
            timestamp: Date.now(),
          };
          localStorage.setItem("hotel_new_booking_toast_alert", JSON.stringify(toastPayload));
          window.dispatchEvent(new CustomEvent("new_room_booked_toast", { detail: toastPayload }));
          window.dispatchEvent(new CustomEvent("booking_created"));
        } catch (e) {
          console.warn("Failed dispatching booking toast alert:", e);
        }

        setSuccessData({
          bookingCode: data.bookingCode || `RES-${Math.floor(10000 + Math.random() * 90000)}`,
          totalPaid: totalPrice,
          paymentMethodUsed: paymentMethodText,
        });
        setStep("success");
      } else {
        setErrorMsg(data.error || "Failed to complete booking. Please try again.");
      }
    } catch {
      setErrorMsg("Network error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn font-jost cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col rounded-3xl bg-white p-6 shadow-2xl transition-all overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at Top */}
        <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {step === "payment" && (
              <button
                type="button"
                onClick={() => setStep("form")}
                className="p-1 text-slate-500 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
              {step === "form" && "Book Room"}
              {step === "payment" && "Payment Checkout"}
              {step === "success" && "Booking Confirmation"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 3: SUCCESS VIEW */}
        {step === "success" && successData ? (
          <div className="flex-1 min-h-0 overflow-y-auto py-8 text-center space-y-4 custom-scrollbar">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
              <FiCheckCircle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Booking Confirmed!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your room reservation <span className="font-bold text-indigo-600">{successData.bookingCode}</span> has been successfully created.
            </p>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-left max-w-md mx-auto text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name:</span>
                <span className="font-semibold text-slate-800">{guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room / Floor:</span>
                <span className="font-semibold text-slate-800">Room {roomNo} ({floorNo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Check-in / Check-out:</span>
                <span className="font-semibold text-slate-800">{checkIn} to {checkOut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{successData.paymentMethodUsed}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Total Paid:</span>
                <span className="text-indigo-600">₹{successData.totalPaid.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/profile");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
              >
                View My Bookings <FiArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : step === "payment" ? (
          /* STEP 2: PAYMENT PAGE VIEW */
          <div className="flex flex-col flex-1 min-h-0 mt-3">
            <div className="flex-1 min-h-0 overflow-y-auto pl-1 pr-3 py-2 space-y-5 custom-scrollbar">
              {errorMsg && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Order Summary Card */}
              <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                  <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Reservation Summary
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {checkIn} → {checkOut}
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      Room {roomNo} • {floorNo}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {guestName} ({guestCount})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Amount</span>
                    <span className="text-xl font-extrabold text-indigo-600">
                      ₹{totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* UPI */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      paymentMethod === "upi"
                        ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">UPI / QR Code</p>
                      <p className="text-xs text-slate-400">GPay, PhonePe, Paytm</p>
                    </div>
                    {paymentMethod === "upi" && (
                      <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <FiCheck className="h-3 w-3" />
                      </div>
                    )}
                  </button>

                  {/* Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      paymentMethod === "card"
                        ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">Credit / Debit Card</p>
                      <p className="text-xs text-slate-400">Visa, Mastercard, RuPay</p>
                    </div>
                    {paymentMethod === "card" && (
                      <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <FiCheck className="h-3 w-3" />
                      </div>
                    )}
                  </button>

                  {/* Net Banking */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("netbanking")}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      paymentMethod === "netbanking"
                        ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">Net Banking</p>
                      <p className="text-xs text-slate-400">All Major Banks</p>
                    </div>
                    {paymentMethod === "netbanking" && (
                      <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <FiCheck className="h-3 w-3" />
                      </div>
                    )}
                  </button>

                  {/* Pay at Hotel */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("hotel")}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      paymentMethod === "hotel"
                        ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">Pay at Hotel</p>
                      <p className="text-xs text-slate-400">Cash / Card on Check-in</p>
                    </div>
                    {paymentMethod === "hotel" && (
                      <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <FiCheck className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Input Form based on selection */}
              {paymentMethod === "upi" && (
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Enter VPA / UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobileNumber@upi / username@okhdfcbank"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-400">You will receive a payment request on your UPI App.</p>
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CVV Code</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "netbanking" && (
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {paymentMethod === "hotel" && (
                <div className="rounded-2xl border border-amber-200 p-4 bg-amber-50/60 text-amber-900 text-sm">
                  <p className="font-bold">Pay at Hotel Selected</p>
                  <p className="text-xs text-amber-700 mt-1">
                    No payment is required right now. You can pay ₹{totalPrice.toLocaleString("en-IN")} via cash or card directly at the hotel front desk during check-in.
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Bottom Action Card for Payment */}
            <div className="flex-shrink-0 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <FiLock className="h-3.5 w-3.5 text-emerald-500" />
                <span>256-Bit SSL Encrypted</span>
              </div>

              <button
                type="button"
                onClick={handleFinalPaymentSubmit}
                disabled={isSubmitting}
                className="rounded-full bg-brand px-8 sm:px-10 py-3.5 text-base font-bold text-white shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₹${totalPrice.toLocaleString("en-IN")} & Confirm`
                )}
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: FORM VIEW */
          <form onSubmit={handleProceedToPayment} className="flex flex-col flex-1 min-h-0 mt-3">
            {/* Scrollable Input Fields Container */}
            <div className="flex-1 min-h-0 overflow-y-auto pl-1 pr-3 py-2 space-y-4 custom-scrollbar">
              {errorMsg && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Guest Full Name */}
              <div>
                <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                  <FiUser className="h-4 w-4 text-indigo-600" />
                  Guest Full Name <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                  Gender <span className="text-indigo-600">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-sm"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Phone & Guests Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                    <FiPhone className="h-4 w-4 text-indigo-600" />
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-32 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                    >
                      {COUNTRY_PHONE_RULES.map((item) => (
                        <option key={`${item.name}-${item.code}`} value={item.code}>{item.name} {item.code}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      maxLength={phoneRule.max}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, phoneRule.max))}
                      placeholder={`${phoneRule.min} digit mobile number`}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-sm"
                    />
                  </div>

                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      const selected = COUNTRY_PHONE_RULES.find((item) => item.name === e.target.value);
                      if (selected) setCountryCode(selected.code);
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    {COUNTRY_PHONE_RULES.map((item) => (
                      <option key={item.name} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                    <FiHome className="h-4 w-4 text-indigo-600" />
                    Number of Guests
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-sm cursor-pointer"
                  >
                    <option value="1 Guest">1 Guest</option>
                    <option value="2 Guests">2 Guests</option>
                    <option value="3 Guests">3 Guests</option>
                    <option value="4 Guests">4 Guests</option>
                    <option value="5+ Guests">5+ Guests</option>
                  </select>
                </div>
              </div>

              {/* Floor No. & Room No. Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Floor No. Dropdown */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                    <FiLayers className="h-4 w-4 text-indigo-600" />
                    Floor No.
                  </label>
                  <select
                    value={floorNo}
                    onChange={(e) => setFloorNo(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-sm cursor-pointer"
                  >
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor (Executive Wing)">4th Floor (Executive Wing)</option>
                    <option value="5th Floor (Penthouse)">5th Floor (Penthouse)</option>
                    <option value="Ground Floor">Ground Floor</option>
                  </select>
                </div>

                {/* Room No. */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                    <FiGrid className="h-4 w-4 text-indigo-600" />
                    Room No.
                  </label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-sm"
                  />
                </div>
              </div>

              {/* Check-In & Check-Out Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Check-In Date */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                    <FiCalendar className="h-4 w-4 text-indigo-600" />
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-sm cursor-pointer font-sans"
                  />
                </div>

                {/* Check-Out Date */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                    <FiCalendar className="h-4 w-4 text-indigo-600" />
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-sm cursor-pointer font-sans"
                  />
                </div>
              </div>

              {/* Document / ID Upload Zone */}
              <div>
                <label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-slate-800">
                  <FiCreditCard className="h-4 w-4 text-indigo-600" />
                  Upload Guest Document / ID (Aadhar, Passport)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/20 p-5 text-center hover:bg-indigo-50/50 hover:border-indigo-400 transition cursor-pointer"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-3 text-left">
                        <FiCheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px] sm:max-w-xs">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                        <FiUploadCloud className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        Click to upload Aadhar / Passport / ID Document
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Accepts PDF, Images, DOC, PNG, JPG
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Best Price Guarantee OTA Comparison Widget */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    🛡️ Best Price Guarantee
                  </span>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                    Direct Booking Discount
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs font-medium">
                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-emerald-200 shadow-xs">
                    <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                      ✨ Direct Website Rate
                    </span>
                    <span className="font-black text-emerald-700 text-sm">
                      ₹{pricePerNight.toLocaleString("en-IN")} <span className="text-[10px] text-emerald-600 font-bold">/ night</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1 text-slate-600">
                    <span className="flex items-center gap-1">🔴 Booking.com</span>
                    <span className="line-through text-slate-400 font-semibold">₹{Math.round(pricePerNight * 1.15).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1 text-slate-600">
                    <span className="flex items-center gap-1">🔵 Agoda</span>
                    <span className="line-through text-slate-400 font-semibold">₹{Math.round(pricePerNight * 1.12).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1 text-slate-600">
                    <span className="flex items-center gap-1">🟡 Expedia</span>
                    <span className="line-through text-slate-400 font-semibold">₹{Math.round(pricePerNight * 1.14).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold border-t border-emerald-200/80 pt-2">
                  <span>🎁 Free Wi-Fi • Early Check-in • Instant Full Refund</span>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Total & Proceed Action Card */}
            <div className="flex-shrink-0 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between bg-white">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Payment:</p>
                <p className="text-2xl sm:text-3xl font-semibold text-slate-900">
                  ₹{totalPrice.toLocaleString("en-IN")}
                </p>
              </div>

              <button
                type="submit"
                className="rounded-full bg-brand px-8 sm:px-10 py-3.5 text-base font-bold text-white shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Proceed <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
