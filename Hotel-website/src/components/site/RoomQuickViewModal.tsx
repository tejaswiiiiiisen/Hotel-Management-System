import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiUsers,
  FiMaximize,
  FiMapPin,
  FiCheck,
  FiHeart,
  FiShield,
  FiClock,
} from "react-icons/fi";
import { TbBed } from "react-icons/tb";
import { useWishlist } from "../../context/WishlistContext";

interface RoomQuickViewModalProps {
  room: any | null;
  onClose: () => void;
  onBookNow?: (room: any) => void;
}

export default function RoomQuickViewModal({
  room,
  onClose,
}: RoomQuickViewModalProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!room) return null;

  const active = room?.id ? isInWishlist(room.id) : false;

  const imagesList: string[] =
    Array.isArray(room.images) && room.images.length > 0
      ? room.images
      : room.image
      ? [room.image]
      : ["/images/1.webp"];

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const roomTitle =
    room.title ||
    room.name ||
    (room.number || room.roomNumber
      ? `Room ${room.number || room.roomNumber}`
      : `${room.type || "Standard"} Room`);

  const branchName =
    room.orgName ||
    room.branchName ||
    (room.orgId === "AS435" || room.org_id === "AS435"
      ? "Ashirwad Branch"
      : room.orgId === "JP01"
      ? "Jaipur Branch"
      : room.orgId === "AJ01"
      ? "Ajmer Branch"
      : room.orgId === "CH560" || room.org_id === "CH560"
      ? "Cheery Clothing Branch"
      : room.orgId === "MA330" || room.org_id === "MA330"
      ? "Matcha Tea Branch"
      : "Main Property");

  const isBooked =
    room.status?.toLowerCase() === "occupied" ||
    room.status?.toLowerCase() === "booked" ||
    room.available === false;

  const price = Number(room.pricePerNight || room.price || 2500);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-slate-900"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-700 shadow-md hover:bg-white hover:text-black transition-all"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Top Gallery Carousel */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-slate-900">
            <img
              src={imagesList[activePhotoIdx]}
              alt={roomTitle}
              className="h-full w-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIdx((prev) =>
                      prev === 0 ? imagesList.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIdx((prev) =>
                      prev === imagesList.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Badges on Gallery */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy backdrop-blur">
                  {room.type || "Luxury Room"}
                </span>
                {room.roomView && (
                  <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    {room.roomView}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    isBooked
                      ? "bg-rose-600/90 text-white"
                      : "bg-emerald-600/90 text-white"
                  }`}
                >
                  {isBooked ? "Occupied" : "Available"}
                </span>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(room)}
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                  active
                    ? "bg-rose-500 text-white"
                    : "bg-white/70 text-slate-700 hover:bg-white"
                }`}
              >
                <FiHeart className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Thumbnails strip */}
            {imagesList.length > 1 && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 rounded-full bg-black/40 backdrop-blur-md">
                {imagesList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === activePhotoIdx ? "w-6 bg-white" : "w-2 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Modal Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-brand mb-1.5">
                <FiMapPin className="h-4 w-4" />
                <span>{branchName}</span>
                {room.floor && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">{room.floor}</span>
                  </>
                )}
                {(room.number || room.roomNumber) && (
                  <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 font-bold">
                    Room #{room.number || room.roomNumber}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {roomTitle}
              </h2>
              {room.rating > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-sm font-semibold text-slate-700">
                  <FiStar className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{Number(room.rating).toFixed(1)}</span>
                  <span className="text-slate-400">
                    ({room.reviewsCount || 12} verified reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {room.description ||
                room.shortDescription ||
                "Indulge in refined comfort featuring top-tier furnishings, plush bedding, and serene views designed for total relaxation."}
            </p>

            {/* Key Specs Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <TbBed className="h-6 w-6 text-brand shrink-0" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Bed Type
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {room.beds || "1 King Bed"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <FiUsers className="h-6 w-6 text-brand shrink-0" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Capacity
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {room.capacity || room.guests || 2} Guests
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <FiMaximize className="h-6 w-6 text-brand shrink-0" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Room Size
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {room.sizeSqm ? `${room.sizeSqm} m²` : "35 m²"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <FiClock className="h-6 w-6 text-brand shrink-0" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Check-in
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    2:00 PM
                  </div>
                </div>
              </div>
            </div>

            {/* Included Amenities */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                Room Amenities &amp; Inclusions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(room.amenities && room.amenities.length > 0
                  ? room.amenities
                  : [
                      "Free High-Speed Wi-Fi",
                      "Climate Control AC",
                      "Smart HD TV",
                      "24/7 Room Service",
                      "Premium Bathroom",
                      "Tea & Coffee Maker",
                    ]
                ).map((amenity: string) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-100"
                  >
                    <FiCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Perks & Guarantees */}
            <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <FiShield className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-semibold">
                  Guaranteed Best Rate • Instant Confirmation • No Hidden Fees
                </span>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                Free Cancellation up to 24h before check-in
              </span>
            </div>

            {/* Footer with Price & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-medium text-slate-400">Total Nightly Rate</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ night</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/rooms/${room.slug || room.id}`}
                  onClick={onClose}
                  className="flex-1 sm:flex-initial text-center rounded-xl px-5 py-3 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Full Room Details
                </Link>

                <Link
                  to={`/booking?room=${room.id || room.slug}${
                    room.orgId ? `&orgId=${room.orgId}` : ""
                  }`}
                  onClick={onClose}
                  className={`flex-1 sm:flex-initial text-center rounded-xl px-7 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
                    isBooked
                      ? "bg-slate-400 cursor-not-allowed pointer-events-none"
                      : "bg-brand hover:opacity-90 shadow-brand/20"
                  }`}
                >
                  {isBooked ? "Currently Booked" : "Book This Room"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
