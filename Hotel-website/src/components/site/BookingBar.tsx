import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiChevronDown, FiCheck } from "react-icons/fi";
import { GiftIcon, CalendarIcon } from "./icons";
import SchedulerModal from "./SchedulerModal";
import GuestsDialog from "./GuestsDialog";
import BookingModal from "./BookingModal";
import BookedTicketModal, { type BookedTicket } from "./BookedTicketModal";
import { useGuests } from "../../context/GuestsContext";
import { apiFetch } from "../../lib/api";
import type { User } from "../../types";

export default function BookingBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeBooking, setActiveBooking] = useState<BookedTicket | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [locations, setLocations] = useState<string[]>([]);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const { guests } = useGuests();

  useEffect(() => {
    let active = true;

    const loadUserAndBookings = () => {
      apiFetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (active && d && d.user) {
            setUser(d.user);
            try { sessionStorage.setItem("user_logged_in", "true"); } catch {}

            // Fetch user's bookings to check if they have a booked room/ticket
            apiFetch("/api/bookings/my-bookings")
              .then((res) => (res.ok ? res.json() : null))
              .then((bookingData) => {
                if (active && bookingData && Array.isArray(bookingData.bookings) && bookingData.bookings.length > 0) {
                  // Find active or current stay booking
                  const current = bookingData.bookings.find(
                    (b: any) => b.type === "Current" || b.status === "Active Stay" || (b.status !== "Cancelled" && b.status !== "Completed" && b.status !== "Checked Out")
                  ) || bookingData.bookings[0];

                  if (current) {
                    setActiveBooking(current);
                    if (current.checkInDate) setCheckInDate(current.checkInDate);
                    if (current.checkOutDate) setCheckOutDate(current.checkOutDate);
                  }
                }
              })
              .catch(() => {});
          } else if (active) {
            setUser(null);
            setActiveBooking(null);
            setCheckInDate(null);
            setCheckOutDate(null);
          }
        })
        .catch(() => {
          if (active) {
            setUser(null);
            setActiveBooking(null);
            setCheckInDate(null);
            setCheckOutDate(null);
          }
        });
    };

    loadUserAndBookings();

    const handleUpdate = () => loadUserAndBookings();
    window.addEventListener("booking_created", handleUpdate);
    window.addEventListener("user_logged_in", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("booking_created", handleUpdate);
      window.removeEventListener("user_logged_in", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch("/api/organizations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.organizations)) {
          const locs = d.organizations
            .map((o: any) => o.location)
            .filter((l: string) => Boolean(l));
          const uniqueLocs = Array.from(new Set(locs)) as string[];
          setLocations(uniqueLocs);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function guard(action: () => void) {
    return () => {
      if (!user) {
        navigate("/login");
        return;
      }
      action();
    };
  }

  // Handle Check-in click: Show booked ticket if user has one, otherwise show available rooms scheduler
  const handleCheckInClick = guard(() => {
    if (activeBooking) {
      setTicketModalOpen(true);
    } else {
      setSchedulerOpen(true);
    }
  });

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 sm:px-0">
        <div className="pointer-events-auto relative flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative hidden sm:block group">
            {/* Continuous ripple effect behind the entire button */}
            <div className="absolute inset-0 rounded-full bg-brand/50 animate-ping [animation-duration:2.5s]"></div>
            
            <button
              type="button"
              aria-label="Offers and coupons"
              onClick={guard(() => navigate("/offers"))}
              className="relative grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(102,126,234,0.5)] active:scale-95 cursor-pointer"
            >
              <GiftIcon className="h-6 w-6 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-[20px] sm:rounded-full bg-white p-4 sm:py-2 sm:pl-2 sm:pr-2 shadow-[0_10px_40px_rgba(0,0,0,0.18)] w-full sm:w-auto max-w-[600px] sm:max-w-none gap-3 sm:gap-0 mx-auto">
            {/* Top Row on Mobile: Dates & Destination */}
            <div className="flex w-full sm:w-auto items-center flex-wrap sm:flex-nowrap">
              {/* Destination */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                  className="w-full px-2 sm:px-4 py-2 sm:py-0 text-left leading-tight cursor-pointer overflow-hidden group"
                >
                  <div className="text-[13px] font-semibold text-navy flex items-center gap-1">
                    <FiMapPin className="text-brand group-hover:scale-110 transition-transform" /> 
                    Destination
                    <FiChevronDown className={`transition-transform ${locationMenuOpen ? "rotate-180" : ""}`} />
                  </div>
                  <div className="text-[13px] text-slate-400 truncate mt-0.5">
                    {selectedLocation || "Select a place"}
                  </div>
                </button>
                {locationMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-3 w-48 sm:w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                    <div className="max-h-[60vh] overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => { setSelectedLocation(""); setLocationMenuOpen(false); }}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-slate-50 cursor-pointer"
                      >
                        <span className={!selectedLocation ? "font-medium text-brand" : "text-slate-700"}>
                          Choose destination
                        </span>
                        {!selectedLocation && <FiCheck className="text-brand" />}
                      </button>
                      {locations.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => { setSelectedLocation(loc); setLocationMenuOpen(false); }}
                          className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-slate-50 cursor-pointer"
                        >
                          <span className={selectedLocation === loc ? "font-medium text-brand" : "text-slate-700"}>
                            {loc}
                          </span>
                          {selectedLocation === loc && <FiCheck className="text-brand" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span className="h-9 w-px bg-slate-200 mx-2 sm:mx-0 flex-shrink-0" />

              {/* Check-in */}
              <button
                type="button"
                onClick={handleCheckInClick}
                className="flex-1 sm:flex-none px-2 sm:px-4 text-left leading-tight cursor-pointer overflow-hidden"
              >
                <div className="text-[13px] font-semibold text-navy flex items-center gap-1">
                  Check-in
                  {activeBooking && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Active Booking" />
                  )}
                </div>
                <div className="text-[13px] text-slate-400 truncate">
                  {checkInDate || "Add date"}
                </div>
              </button>

              <span className="h-9 w-px bg-slate-200 mx-2 sm:mx-0 flex-shrink-0" />

              {/* Check-out */}
              <button
                type="button"
                onClick={handleCheckInClick}
                className="flex-1 sm:flex-none px-2 sm:px-4 text-left leading-tight cursor-pointer overflow-hidden"
              >
                <div className="text-[13px] font-semibold text-navy">Check-out</div>
                <div className="text-[13px] text-slate-400 truncate">
                  {checkOutDate || "Add date"}
                </div>
              </button>
            </div>

            <span className="hidden sm:block h-9 w-px bg-slate-200" />

            {/* Middle Row on Mobile: Guests */}
            <div className="flex w-full sm:w-auto items-center border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
              <button
                type="button"
                onClick={guard(() => setGuestsOpen(true))}
                className="w-full px-2 sm:px-4 text-left leading-tight cursor-pointer overflow-hidden"
              >
                <div className="text-[13px] font-semibold text-navy">Guests</div>
                <div className="text-[13px] text-slate-400 truncate">
                  {guests.length
                    ? `${guests.length} person${guests.length === 1 ? "" : "s"}`
                    : "Add persons"}
                </div>
              </button>
            </div>

            <span className="hidden sm:block h-9 w-px bg-slate-200" />

            {/* Bottom Row on Mobile: Buttons */}
            <div className="flex w-full sm:w-auto items-center gap-3 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0 sm:ml-2">
              <button
                type="button"
                onClick={guard(() => navigate(selectedLocation ? `/contact?location=${encodeURIComponent(selectedLocation)}` : "/contact"))}
                className="flex-1 sm:flex-none rounded-full bg-brand px-4 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 sm:px-7 sm:py-3 sm:text-[15px] cursor-pointer text-center"
              >
                Enquire
              </button>
              <button
                type="button"
                onClick={guard(() => navigate(selectedLocation ? `/booking?location=${encodeURIComponent(selectedLocation)}` : "/booking"))}
                className="flex-1 sm:flex-none rounded-full bg-brand px-4 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 sm:px-8 sm:py-3 sm:text-[15px] cursor-pointer text-center"
              >
                Book
              </button>
            </div>
          </div>

          <button
            type="button"
            aria-label="Open scheduler"
            onClick={handleCheckInClick}
            className="hidden h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-90 sm:grid cursor-pointer"
          >
            <CalendarIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {ticketModalOpen && activeBooking && (
        <BookedTicketModal
          booking={activeBooking}
          onClose={() => setTicketModalOpen(false)}
          onBookAnother={() => setSchedulerOpen(true)}
        />
      )}

      {schedulerOpen && (
        <SchedulerModal onClose={() => setSchedulerOpen(false)} />
      )}
      {guestsOpen && <GuestsDialog onClose={() => setGuestsOpen(false)} />}
      {bookingModalOpen && (
        <BookingModal
          onClose={() => setBookingModalOpen(false)}
          initialCheckIn={checkInDate || undefined}
          initialCheckOut={checkOutDate || undefined}
          initialGuests={
            guests.length
              ? `${guests.length} Guest${guests.length > 1 ? "s" : ""}`
              : "2 Guests"
          }
        />
      )}
    </>
  );
}
