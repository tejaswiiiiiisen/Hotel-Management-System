import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiCalendar,
  FiUser,
  FiHome,
  FiMapPin,
  FiCreditCard,
  FiClock,
  FiX,
  FiArrowRight,
} from "react-icons/fi";

export interface BookedTicket {
  id?: string;
  pkId?: number;
  bookingCode?: string;
  roomName?: string;
  roomNumber?: string;
  floor?: string;
  roomView?: string;
  location?: string;
  status?: string;
  type?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  nights?: number;
  days?: number;
  guests?: string;
  amountPaid?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  image?: string;
  guestName?: string;
  guestPhone?: string;
}

interface BookedTicketModalProps {
  booking: BookedTicket;
  onClose: () => void;
  onBookAnother: () => void;
}

export default function BookedTicketModal({
  booking,
  onClose,
  onBookAnother,
}: BookedTicketModalProps) {
  const navigate = useNavigate();

  const bookingId = booking.id || booking.bookingCode || "RES-BOOKING";
  const roomTitle = booking.roomName || `Room ${booking.roomNumber || "101"}`;
  const checkIn = booking.checkInDate || "Active Stay";
  const checkOut = booking.checkOutDate || "Upcoming";

  // Compute dynamic status based on check-in & check-out dates
  const getComputedStatus = () => {
    if (booking.status && booking.status !== "Active Stay" && booking.status !== "Active") {
      return booking.status;
    }
    if (!booking.checkInDate) return "Active Stay";

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const inDate = new Date(booking.checkInDate);
      if (!isNaN(inDate.getTime())) {
        const inMidnight = new Date(inDate.getFullYear(), inDate.getMonth(), inDate.getDate());
        if (today.getTime() < inMidnight.getTime()) {
          return "Upcoming Reservation";
        }
      }
      if (booking.checkOutDate) {
        const outDate = new Date(booking.checkOutDate);
        if (!isNaN(outDate.getTime())) {
          const outMidnight = new Date(outDate.getFullYear(), outDate.getMonth(), outDate.getDate());
          if (today.getTime() >= outMidnight.getTime()) {
            return "Checked Out";
          }
        }
      }
    } catch {}

    return "Active Stay";
  };

  const computedStatus = getComputedStatus();
  const isUpcoming = computedStatus === "Upcoming Reservation";
  const isCheckedOut = computedStatus === "Checked Out" || computedStatus === "Completed";

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn font-jost cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl bg-white p-6 shadow-2xl transition-all overflow-hidden cursor-default border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-steel/10 text-steel font-bold text-xl shadow-xs">
              🎟️
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy leading-tight">
                Your Booked Ticket
              </h2>
              <p className="text-xs text-steel font-bold tracking-wide">
                Reservation #{bookingId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-navy transition-colors cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto pl-1 pr-4 py-4 space-y-4 custom-scrollbar">
          {/* Dynamic Status Banner */}
          <div
            className={`flex items-center justify-between rounded-2xl p-4 text-white shadow-md ${
              isUpcoming
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-indigo-500/20"
                : isCheckedOut
                ? "bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 shadow-slate-500/20"
                : "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 shadow-emerald-500/15"
            }`}
          >
            <div className="flex items-center gap-3">
              <FiCheckCircle className="h-7 w-7 text-white flex-shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  Status
                </p>
                <p className="text-base font-extrabold leading-tight">
                  {computedStatus}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur-md">
              {isUpcoming ? "Upcoming 📅" : isCheckedOut ? "Checked Out 🧹" : "Booked ✓"}
            </span>
          </div>

          {/* Room Image & Title */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-xs">
            <img
              src={booking.image || "/images/rooms/room-1.avif"}
              alt={roomTitle}
              className="h-44 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <h3 className="text-lg font-extrabold drop-shadow-sm">
                {roomTitle}
              </h3>
              <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-0.5">
                <FiMapPin className="h-3.5 w-3.5 text-steel" />
                {booking.floor || "Executive Wing"} • {booking.roomView || "Standard View"}
              </p>
            </div>
          </div>

          {/* Dates & Time Breakdown */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4 border border-slate-200/80">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-steel uppercase tracking-wider mb-1">
                <FiCalendar className="h-3.5 w-3.5" /> Check-In Date
              </div>
              <div className="text-base font-extrabold text-navy">
                {checkIn}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <FiClock className="h-3 w-3" /> {booking.checkInTime || "02:00 PM"}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-steel uppercase tracking-wider mb-1">
                <FiCalendar className="h-3.5 w-3.5" /> Check-Out Date
              </div>
              <div className="text-base font-extrabold text-navy">
                {checkOut}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <FiClock className="h-3 w-3" /> {booking.checkOutTime || "11:00 AM"}
              </div>
            </div>
          </div>

          {/* Guest & Payment Info */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 space-y-2.5 text-sm shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FiUser className="h-4 w-4 text-steel" /> Guest Name:
              </span>
              <span className="font-bold text-navy">
                {booking.guestName || "Primary Guest"}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FiHome className="h-4 w-4 text-steel" /> Occupancy:
              </span>
              <span className="font-semibold text-navy">
                {booking.guests || "2 Guests"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FiCreditCard className="h-4 w-4 text-steel" /> Payment:
              </span>
              <div className="text-right">
                <span className="font-extrabold text-navy text-base">
                  ₹{Number(booking.amountPaid || 2500).toLocaleString("en-IN")}
                </span>
                <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {booking.paymentStatus || "Paid"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <button
            type="button"
            onClick={() => {
              onClose();
              onBookAnother();
            }}
            className="w-full sm:w-1/2 rounded-full border border-slate-200 bg-slate-100/90 px-4 py-3 text-xs sm:text-sm font-semibold text-navy hover:bg-slate-200 transition-all text-center cursor-pointer flex items-center justify-center"
          >
            Book Another Room
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/profile");
            }}
            className="w-full sm:w-1/2 rounded-full bg-brand px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all text-center cursor-pointer flex items-center justify-center gap-2"
          >
            My Profile Bookings <FiArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
