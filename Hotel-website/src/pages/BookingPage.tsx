import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiCalendar,
  FiHome,
  FiCoffee,
  FiTruck,
  FiMessageSquare,
  FiShield,
  FiMail,
  FiPhone,
  FiMinus,
  FiPlus,
  FiCheck,
  FiCreditCard,
  FiCheckCircle,
} from "react-icons/fi";

import PageHeader from "../components/site/PageHeader";
import SiteFooter from "../components/site/SiteFooter";
import { apiFetch } from "../lib/api";
import { useTitle } from "../lib/useTitle";

interface RoomOption {
  id: number;
  name: string;
  slug: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  available: boolean;
  status?: string;
  image?: string;
  orgId?: string;
}

export default function BookingPage() {
  useTitle("Book Room — Tejas Luxury Hotel");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const roomSlugParam = params.get("room");

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000 * 2)
    .toISOString()
    .split("T")[0];

  // STEP STATE (1 = Select Room & Dates, 2 = Guest Info, 3 = Payment & Confirm, 4 = Success)
  const [step, setStep] = useState(1);

  // ROOMS LIST & SELECTION
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // FORM INPUTS
  const [checkInDate, setCheckInDate] = useState(today);
  const [checkOutDate, setCheckOutDate] = useState(tomorrow);
  const [guestsCount, setGuestsCount] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pay_at_hotel");

  // SUBMIT & SUCCESS STATES
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingConfirmation, setBookingConfirmation] = useState<{
    bookingCode: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    guestName: string;
  } | null>(null);

  // Load available rooms from Backend API and Local Storage (Sorted: Available first, Occupied last)
  useEffect(() => {
    let active = true;
    setLoadingRooms(true);

    const sortAvailableFirst = (list: RoomOption[]): RoomOption[] => {
      return [...list].sort((a, b) => {
        const aVal = a.available && String(a.status || "").toLowerCase() !== "occupied" ? 1 : 0;
        const bVal = b.available && String(b.status || "").toLowerCase() !== "occupied" ? 1 : 0;
        return bVal - aVal;
      });
    };

    const loadLocalRooms = () => {
      try {
        let stored = localStorage.getItem("hotel_rooms_data");
        if (!stored) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.includes("hotel_rooms_data")) {
              stored = localStorage.getItem(k);
              if (stored) break;
            }
          }
        }
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mapped: RoomOption[] = parsed.map((r) => ({
              id: r.id,
              name: r.name || (r.number ? `Room ${r.number}` : `${r.type || "Standard"} Room`),
              slug: r.slug || `room-${r.number || r.id}`,
              type: r.type || "Standard",
              pricePerNight: Number(r.price || r.pricePerNight || 2500),
              capacity: Number(r.guests || r.capacity || 2),
              available: r.status ? r.status.toLowerCase() === "available" : !r.booking,
              status: r.status || (r.booking ? "Occupied" : "Available"),
              image: r.image || (Array.isArray(r.images) && r.images.length ? r.images[0] : ""),
              orgId: r.org_id || r.orgId,
            }));
            const sorted = sortAvailableFirst(mapped);
            if (active) setRooms(sorted);
            return sorted;
          }
        }
      } catch (e) {
        console.warn("Failed to parse local rooms in booking page:", e);
      }
      return [];
    };

    apiFetch("/api/rooms")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const arr = Array.isArray(data) ? data : data && Array.isArray(data.rooms) ? data.rooms : null;
        if (arr && arr.length > 0) {
          const mapped: RoomOption[] = arr.map((r) => ({
            id: r.id,
            name: r.name || (r.roomNumber ? `Room ${r.roomNumber}` : `${r.type || "Standard"} Room`),
            slug: r.slug || `room-${r.roomNumber || r.id}`,
            type: r.type || "Standard",
            pricePerNight: Number(r.pricePerNight || r.price || 2500),
            capacity: Number(r.capacity || r.guests || 2),
            available: r.status ? r.status.toLowerCase() === "available" : !r.booking,
            status: r.status || (r.booking ? "Occupied" : "Available"),
            image: r.image || (Array.isArray(r.images) && r.images.length ? r.images[0] : ""),
            orgId: r.org_id || r.orgId,
          }));
          const sorted = sortAvailableFirst(mapped);
          setRooms(sorted);
        } else {
          loadLocalRooms();
        }
      })
      .catch(() => {
        if (active) loadLocalRooms();
      })
      .finally(() => active && setLoadingRooms(false));
  }, []);


  // Pre-select room if param matches
  useEffect(() => {
    if (rooms.length > 0) {
      if (roomSlugParam) {
        const found = rooms.find((r) => r.slug === roomSlugParam || String(r.id) === roomSlugParam);
        if (found) {
          setSelectedRoom(found);
          return;
        }
      }
      // Default to first available room if none selected
      const firstAvail = rooms.find((r) => r.available);
      if (firstAvail) setSelectedRoom(firstAvail);
    }
  }, [rooms, roomSlugParam]);

  // Calculate stay duration & bill
  const calculateNights = () => {
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
      return isNaN(diff) || diff <= 0 ? 1 : diff;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const roomPrice = selectedRoom?.pricePerNight || 2500;
  const totalAmount = nights * roomPrice;

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Submit Reservation to Backend MySQL DB & Local Storage
  const handleFinalBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) {
      setErrorMsg("Please select a room to book.");
      return;
    }
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setErrorMsg("Please enter your name, email and phone number.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    const checkInFormatted = formatDateDisplay(checkInDate);
    const checkOutFormatted = formatDateDisplay(checkOutDate);
    const generatedCode = `RES-${Math.floor(10000 + Math.random() * 90000)}`;

    const bookingPayload = {
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      roomNumber: String(selectedRoom.id),
      checkInDate: checkInFormatted,
      checkOutDate: checkOutFormatted,
      guests: `${guestsCount} Guests`,
      amountPaid: totalAmount,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      paymentMethod,
      source: "website",
      orgId: selectedRoom.orgId || undefined,
    };

    try {
      // 1. Submit booking to backend Express & MySQL database
      const res = await apiFetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.details || errData.error || "Failed to create booking.");
        setSubmitting(false);
        return; // Stop execution, don't show success screen
      }

      // 2. Mark room status as Occupied in MySQL database
      await apiFetch(`/api/rooms/${selectedRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Occupied", available: false }),
      });
    } catch (err: any) {
      console.warn("Backend API booking submission error:", err);
      setErrorMsg(err?.message || "An unexpected error occurred during booking. Please try again.");
      setSubmitting(false);
      return;
    }

    // 3. Update localStorage so room status syncs across tabs/apps
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          if (k.includes("hotel_rooms_data")) {
            const stored = localStorage.getItem(k);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                const updated = parsed.map((r) => {
                  if (r.id === selectedRoom.id || r.slug === selectedRoom.slug) {
                    return {
                      ...r,
                      status: "Occupied",
                      available: false,
                      booking: {
                        guestName: guestName.trim(),
                        bookingId: generatedCode,
                        checkIn: checkInFormatted,
                        checkOut: checkOutFormatted,
                      },
                    };
                  }
                  return r;
                });
                localStorage.setItem(k, JSON.stringify(updated));
              }
            }
          }
        }
      }

      // Notify open admin dashboard tabs
      try {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("booking_created"));
      } catch { }
    } catch (e) {
      console.warn("Failed updating local storage rooms:", e);
    }

    setSubmitting(false);
    setBookingConfirmation({
      bookingCode: generatedCode,
      roomName: selectedRoom.name,
      checkIn: checkInFormatted,
      checkOut: checkOutFormatted,
      totalAmount,
      guestName: guestName.trim(),
    });
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-cream font-jost text-navy dark:bg-slate-950 dark:text-white pb-10 sm:pb-0">
      <PageHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:py-8 lg:py-12 sm:px-6 lg:px-8">
        {/* PROGRESS STEP BAR (STEPS 1 - 3) */}
        {step < 4 && (
          <div className="mb-6 lg:mb-10">
            {/* Mobile Compact Stepper */}
            <div className="lg:hidden flex flex-col gap-2 mb-2">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Step {step} of 3</div>
              <div className="text-lg font-bold text-navy dark:text-white">
                {step === 1 && "Dates & Room"}
                {step === 2 && "Guest Details"}
                {step === 3 && "Payment & Confirm"}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 3 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"}`} />
              </div>
            </div>

            {/* Desktop Stepper */}
            <div className="hidden lg:flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 text-sm font-bold">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${step === 1 ? "bg-amber-500 text-white shadow-md scale-105" : step > 1 ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40" : "text-slate-500 hover:text-navy dark:hover:text-white"
                  }`}
              >
                {step > 1 ? <FiCheckCircle className="h-5 w-5" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white text-[10px] bg-opacity-20">1</span>}
                <span>Dates &amp; Room</span>
              </button>

              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 mx-6" />

              <button
                type="button"
                onClick={() => selectedRoom && setStep(2)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${step === 2 ? "bg-amber-500 text-white shadow-md scale-105" : step > 2 ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40" : "text-slate-500 hover:text-navy dark:hover:text-white"
                  } ${!selectedRoom ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!selectedRoom}
              >
                {step > 2 ? <FiCheckCircle className="h-5 w-5" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[10px] text-inherit border border-current">2</span>}
                <span>Guest Details</span>
              </button>

              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 mx-6" />

              <button
                type="button"
                onClick={() => selectedRoom && guestName && setStep(3)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${step === 3 ? "bg-amber-500 text-white shadow-md scale-105" : "text-slate-500 hover:text-navy dark:hover:text-white"
                  } ${(!selectedRoom || !guestName) ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!selectedRoom || !guestName}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[10px] text-inherit border border-current">3</span>
                <span>Payment &amp; Confirm</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: SELECT DATES & ROOM */}
        {step === 1 && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* DATES & GUESTS SELECTOR */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiCalendar className="text-amber-500" /> Select Stay Dates &amp; Guests
                </h2>

                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Check-In Date</label>
                    <input
                      type="date"
                      value={checkInDate}
                      min={today}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white min-h-[46px]"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Check-Out Date</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white min-h-[46px]"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Guests</label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white min-h-[46px]"
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SELECT ROOM SELECTION GRID */}
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiHome className="text-amber-500" /> Choose Accommodations
                </h2>

                {loadingRooms ? (
                  <div className="py-8 text-center text-sm text-slate-500">Loading rooms from database...</div>
                ) : (
                  <div className="space-y-3">
                    {rooms.map((r) => {
                      const isSelected = selectedRoom?.id === r.id;
                      const isOccupied = !r.available || r.status?.toLowerCase() === "occupied";

                      return (
                        <div
                          key={r.id}
                          onClick={() => !isOccupied && setSelectedRoom(r)}
                          className={`flex flex-col sm:flex-row overflow-hidden rounded-2xl border transition-all cursor-pointer ${isOccupied
                              ? "opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed dark:bg-slate-800/20 dark:border-slate-800"
                              : isSelected
                                ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/30 shadow-md dark:bg-amber-950/40"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm dark:bg-slate-800 dark:border-slate-700"
                            }`}
                        >
                          <div className="w-full sm:w-48 lg:w-56 flex-shrink-0 relative">
                            <img
                              src={r.image || "/images/rooms/room-1.avif"}
                              alt={r.name}
                              className="w-full h-full aspect-[16/9] sm:aspect-[4/3] object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                <FiCheck /> Selected
                              </div>
                            )}
                          </div>
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-4">
                                <h3 className="font-bold text-lg sm:text-base text-navy dark:text-white break-words">
                                  {r.name}
                                </h3>
                                <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-md font-bold whitespace-nowrap ${isOccupied
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                  }`}>
                                  {isOccupied ? "Occupied" : "Available"}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200/50 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50">
                                  {r.orgId === "AS435" ? "📍 Ashirwad Branch" : r.orgId === "CH560" ? "📍 Cheery Clothing" : r.orgId === "MA330" ? "📍 Matcha Tea" : "📍 Main Branch"}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{r.type} · Up to {r.capacity} Guests</span>
                              </div>
                            </div>

                            <div className="mt-4 sm:mt-0 flex items-end justify-between sm:justify-end sm:gap-6 border-t border-slate-100 sm:border-0 pt-3 sm:pt-0 dark:border-slate-800">
                              <div className="text-left sm:text-right">
                                <span className="text-xl sm:text-lg font-black text-navy dark:text-white block sm:inline">
                                  ₹{r.pricePerNight.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[11px] sm:text-xs text-slate-400 ml-1">/ night</span>
                              </div>

                              <button
                                type="button"
                                className={`sm:hidden px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isOccupied ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : isSelected ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-900 text-white dark:bg-slate-700'
                                  }`}
                                disabled={isOccupied}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* SUMMARY ASIDE */}
            <div className="lg:col-span-1">
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 sticky top-8 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">Reservation Summary</h3>

                {selectedRoom ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Selected Room</span>
                      <span className="font-bold text-right">
                        <div>{selectedRoom.name}</div>
                        <div className="text-xs text-amber-600 mt-1">
                          {selectedRoom.orgId === "AS435" ? "📍 Ashirwad Branch" : selectedRoom.orgId === "CH560" ? "📍 Cheery Clothing Branch" : selectedRoom.orgId === "MA330" ? "📍 Matcha Tea Branch" : "📍 Main Branch"}
                        </div>
                      </span>
                    </div>

                    <div className="flex justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-bold">{nights} {nights === 1 ? "Night" : "Nights"}</span>
                    </div>

                    <div className="flex justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Nightly Rate</span>
                      <span className="font-bold">₹{roomPrice.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="pt-2 flex justify-between text-base font-extrabold text-navy dark:text-white">
                      <span>Total Amount</span>
                      <span className="text-amber-600">₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="hidden lg:block">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white shadow-md hover:from-amber-600 hover:to-amber-700 transition-transform active:scale-95"
                      >
                        Continue to Guest Details →
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Please select an available room.</p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* MOBILE STICKY CTA */}
        {step === 1 && selectedRoom && (
          <>
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] z-40 dark:bg-slate-900 dark:border-slate-800 animate-slideUp">
              <div className="max-w-5xl mx-auto flex gap-4 items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total for {nights} Night{nights > 1 ? 's' : ''}</span>
                  <span className="text-xl font-black text-amber-600 leading-none">₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 max-w-[200px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-md hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-transform"
                >
                  Continue →
                </button>
              </div>
            </div>
            {/* ADD PADDING ON MOBILE SO STICKY CTA DOESNT COVER CONTENT */}
            <div className="h-24 lg:hidden" />
          </>
        )}

        {/* STEP 2: GUEST DETAILS */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-white p-5 sm:p-8 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FiUser className="text-amber-500" /> Guest Details &amp; Contact
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Full Name *</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Email Address *</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="guest@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Phone Number *</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">Special Requests / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Early check-in request, high floor..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 dark:text-slate-300 dark:border-slate-700"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (guestName && guestEmail && guestPhone) setStep(3);
                    else setErrorMsg("Please fill out all required fields.");
                  }}
                  className="flex-1 rounded-xl bg-amber-500 py-3 text-white font-bold text-sm uppercase tracking-wider hover:bg-amber-600"
                >
                  Proceed to Payment →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT & CONFIRMATION */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-white p-5 sm:p-8 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FiCreditCard className="text-amber-500" /> Select Payment &amp; Confirm Booking
            </h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFinalBookingSubmit} className="space-y-6">
              {/* BOOKING RECAP CARD */}
              <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-200 text-sm dark:bg-amber-950/40 dark:border-amber-900">
                <div className="flex justify-between font-bold text-base text-navy dark:text-white mb-2">
                  <div>
                    {selectedRoom?.name}
                    <div className="text-xs text-amber-600 mt-1 font-bold">
                      {selectedRoom?.orgId === "AS435" ? "📍 Ashirwad Branch" : selectedRoom?.orgId === "CH560" ? "📍 Cheery Clothing Branch" : selectedRoom?.orgId === "MA330" ? "📍 Matcha Tea Branch" : "📍 Main Branch"}
                    </div>
                  </div>
                  <span className="text-amber-600">₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div>Guest: <strong>{guestName}</strong> ({guestEmail})</div>
                  <div>Stay: <strong>{formatDateDisplay(checkInDate)}</strong> to <strong>{formatDateDisplay(checkOutDate)}</strong> ({nights} Nights)</div>
                </div>
              </div>

              {/* PAYMENT OPTIONS */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-3 dark:text-slate-400">Payment Option</label>
                <div className="space-y-2">
                  <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${paymentMethod === "pay_at_hotel" ? "border-amber-500 bg-amber-50/50" : "border-slate-200"
                    }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        value="pay_at_hotel"
                        checked={paymentMethod === "pay_at_hotel"}
                        onChange={() => setPaymentMethod("pay_at_hotel")}
                      />
                      <span className="font-bold text-sm">Pay at Hotel on Arrival</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold">✓ No Deposit Required</span>
                  </label>

                  <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${paymentMethod === "upi_card" ? "border-amber-500 bg-amber-50/50" : "border-slate-200"
                    }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        value="upi_card"
                        checked={paymentMethod === "upi_card"}
                        onChange={() => setPaymentMethod("upi_card")}
                      />
                      <span className="font-bold text-sm">Pay Online (UPI / Card / NetBanking)</span>
                    </div>
                    <span className="text-xs text-amber-600 font-bold">Instant Confirmation</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 dark:text-slate-300 dark:border-slate-700"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-white font-bold text-sm uppercase tracking-wider shadow-lg hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting to MySQL DB..." : "Confirm & Complete Booking"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION DISPLAY */}
        {step === 4 && bookingConfirmation && (
          <div className="max-w-xl mx-auto rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 animate-fadeIn">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <FiCheckCircle className="h-8 w-8" />
            </div>

            <h1 className="text-3xl font-black text-navy dark:text-white">Booking Confirmed!</h1>
            <p className="mt-1 text-sm text-slate-500">Your reservation has been recorded in the MySQL database.</p>

            <div className="my-6 rounded-2xl bg-amber-50 p-6 border border-amber-200 text-left text-sm space-y-2 dark:bg-amber-950/40 dark:border-amber-900">
              <div className="flex justify-between border-b border-amber-200/60 pb-2">
                <span className="text-slate-500">Booking Reference Code</span>
                <span className="font-extrabold text-amber-700 dark:text-amber-400">{bookingConfirmation.bookingCode}</span>
              </div>
              <div className="flex justify-between border-b border-amber-200/60 pb-2">
                <span className="text-slate-500">Guest Name</span>
                <span className="font-bold">{bookingConfirmation.guestName}</span>
              </div>
              <div className="flex justify-between border-b border-amber-200/60 pb-2">
                <span className="text-slate-500">Reserved Room</span>
                <span className="font-bold">{bookingConfirmation.roomName}</span>
              </div>
              <div className="flex justify-between border-b border-amber-200/60 pb-2">
                <span className="text-slate-500">Check-In Date</span>
                <span className="font-bold">{bookingConfirmation.checkIn}</span>
              </div>
              <div className="flex justify-between border-b border-amber-200/60 pb-2">
                <span className="text-slate-500">Check-Out Date</span>
                <span className="font-bold">{bookingConfirmation.checkOut}</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-base text-navy dark:text-white">
                <span>Total Bill Amount</span>
                <span className="text-amber-600">₹{bookingConfirmation.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                to="/rooms"
                className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm shadow hover:bg-amber-600"
              >
                Explore More Rooms
              </Link>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}