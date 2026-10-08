import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TbBed } from "react-icons/tb";
import {
  FiUsers,
  FiMaximize,
  FiWifi,
  FiWind,
  FiHeart,
  FiMapPin,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiShield,
} from "react-icons/fi";
import { useWishlist } from "../../context/WishlistContext";

interface RoomRowProps {
  room: any;
  reverse?: boolean;
  index?: number;
  onQuickView?: (room: any) => void;
}

export default function RoomRow({
  room,
  reverse = false,
  onQuickView,
}: RoomRowProps) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
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
      ? "Ashirwad"
      : room.orgId === "JP01"
      ? "Jaipur"
      : room.orgId === "AJ01"
      ? "Ajmer"
      : room.orgId === "CH560" || room.org_id === "CH560"
      ? "Cheery Clothing"
      : room.orgId === "MA330" || room.org_id === "MA330"
      ? "Matcha Tea"
      : "Main Property");

  const isBooked =
    room.status?.toLowerCase() === "occupied" ||
    room.status?.toLowerCase() === "booked" ||
    room.available === false;

  const price = Number(room.pricePerNight || room.price || 2500);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBooked) return;
    navigate(`/booking?room=${room.id || room.slug}${room.orgId ? `&orgId=${room.orgId}` : ""}`);
  };

  return (
    <article className="group overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand/40 transition-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
        {/* Photo Carousel Column (5 cols) */}
        <div
          className={`relative md:col-span-5 aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100 ${
            reverse ? "md:order-last" : ""
          }`}
        >
          <img
            src={imagesList[activePhotoIdx] || imagesList[0]}
            alt={roomTitle}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Carousel buttons */}
          {imagesList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Badges on image */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pointer-events-none">
            {room.type && (
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy shadow-sm backdrop-blur">
                {room.type}
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold shadow-md backdrop-blur ${
                isBooked ? "bg-rose-600/90 text-white" : "bg-emerald-600/95 text-white"
              }`}
            >
              {isBooked ? "Reserved" : "Available"}
            </span>
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(room)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 backdrop-blur shadow-sm hover:scale-110 active:scale-95 transition-all"
              >
                <FiEye className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleWishlist(room)}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur shadow-sm transition-all hover:scale-110 active:scale-95 ${
                active ? "bg-rose-500 text-white" : "bg-white/90 text-slate-700"
              }`}
            >
              <FiHeart className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
            </button>
          </div>

          {room.roomView && (
            <span className="absolute left-3 bottom-3 rounded-full bg-black/60 backdrop-blur px-2.5 py-0.5 text-xs font-medium text-white border border-white/10">
              {room.roomView}
            </span>
          )}
        </div>

        {/* Info Column (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between p-6 sm:p-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-brand bg-brand/5 px-2.5 py-1 rounded-lg border border-brand/10">
                <FiMapPin className="h-3 w-3" />
                {branchName}
              </span>

              <div className="flex items-center gap-2 text-slate-400 font-semibold">
                {room.floor && <span>{room.floor}</span>}
                {(room.number || room.roomNumber) && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                    Room #{room.number || room.roomNumber}
                  </span>
                )}
                {room.rating > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-500 font-bold ml-1">
                    <FiStar className="h-3.5 w-3.5 fill-amber-400" />
                    {Number(room.rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            <Link to={`/rooms/${room.slug || room.id}`}>
              <h3 className="text-xl sm:text-2xl font-extrabold text-navy hover:text-brand transition-colors">
                {roomTitle}
              </h3>
            </Link>

            <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">
              {room.shortDescription ||
                room.description ||
                "Enjoy exceptional luxury with spacious interior design, premium bedding, high-speed amenities and scenic outlooks."}
            </p>

            {/* Feature specs row */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <FiUsers className="h-4 w-4 text-brand" />
                <span>{room.capacity || room.guests || 2} Guests</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <TbBed className="h-4 w-4 text-brand" />
                <span>{room.beds || "King Bed"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <FiMaximize className="h-4 w-4 text-brand" />
                <span>{room.sizeSqm ? `${room.sizeSqm} m²` : "32 m²"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <FiWifi className="h-4 w-4 text-emerald-600" />
                <span>Free Wi-Fi</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <FiWind className="h-4 w-4 text-sky-600" />
                <span>Climate AC</span>
              </div>
            </div>
          </div>

          {/* Pricing & CTA Bottom Row */}
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mb-0.5">
                <FiShield className="h-3.5 w-3.5" />
                <span>Best Rate Guarantee • Free Cancellation</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-slate-400">/ night</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to={`/rooms/${room.slug || room.id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                View Details
              </Link>
              <button
                type="button"
                onClick={handleBookNow}
                disabled={isBooked}
                className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-extrabold shadow-sm transition-all active:scale-95 ${
                  isBooked
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-brand text-white hover:opacity-90 hover:shadow-md"
                }`}
              >
                {isBooked ? "Booked" : "Book Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
