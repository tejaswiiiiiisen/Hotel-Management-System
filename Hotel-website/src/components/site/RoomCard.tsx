import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiStar,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
} from "react-icons/fi";
import { useWishlist } from "../../context/WishlistContext";

interface RoomCardProps {
  room: any;
  onQuickView?: (room: any) => void;
}

export default function RoomCard({ room, onQuickView }: RoomCardProps) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const active = room?.id ? isInWishlist(room.id) : false;

  const roomTitle =
    room.title ||
    room.name ||
    (room.number || room.roomNumber
      ? `Room ${room.number || room.roomNumber}`
      : `${room.type || "Standard"} Room`);

  const imagesList: string[] =
    Array.isArray(room.images) && room.images.length > 0
      ? room.images
      : room.image
      ? [room.image]
      : ["/images/1.webp"];

  const [activeIdx, setActiveIdx] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const branchName =
    room.orgName ||
    room.branchName ||
    (room.orgId === "AS435" || room.org_id === "AS435"
      ? "Ashirwad"
      : room.orgId === "JP01"
      ? "Jaipur Branch"
      : room.orgId === "AJ01"
      ? "Ajmer Branch"
      : room.orgId === "CH560" || room.org_id === "CH560"
      ? "Cheery Clothing"
      : room.orgId === "MA330" || room.org_id === "MA330"
      ? "Matcha Tea"
      : "Luxury Stay");

  const isBooked =
    room.status?.toLowerCase() === "occupied" ||
    room.status?.toLowerCase() === "booked" ||
    room.available === false;

  const price = Number(room.pricePerNight || room.price || 2500);

  return (
    <div className="group relative flex flex-col font-sans cursor-pointer">
      {/* 1. Large Rounded Photo Carousel */}
      <div className="relative aspect-[20/19] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-100">
        <Link to={`/rooms/${room.slug || room.id}`} className="block h-full w-full">
          <img
            src={imagesList[activeIdx] || imagesList[0]}
            alt={roomTitle}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Top-Left Boutique Tag */}
        <div className="absolute left-3.5 top-3.5 pointer-events-none">
          {room.isPopular || room.rating >= 4.6 ? (
            <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow-sm backdrop-blur-md">
              Guest favourite
            </span>
          ) : room.roomView ? (
            <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-md">
              {room.roomView}
            </span>
          ) : (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur-md ${
                isBooked
                  ? "bg-rose-600/90 text-white"
                  : "bg-emerald-600/90 text-white"
              }`}
            >
              {isBooked ? "Reserved" : "Available"}
            </span>
          )}
        </div>

        {/* Top-Right Wishlist Heart & Quick View */}
        <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 z-20">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(room);
              }}
              title="Quick view"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 backdrop-blur-md shadow-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
            >
              <FiEye className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(room);
            }}
            aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90"
          >
            <FiHeart
              className={`h-5 w-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] transition-colors ${
                active
                  ? "fill-rose-500 text-rose-500"
                  : "text-white fill-black/30 hover:fill-black/50"
              }`}
            />
          </button>
        </div>

        {/* Multi-Photo Carousel Arrows (Shown on card hover) */}
        {imagesList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 transition-all"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 transition-all"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 rounded-full p-1">
              {imagesList.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIdx
                      ? "w-2.5 bg-white shadow-sm"
                      : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. Airbnb Typographic Details Block */}
      <Link to={`/rooms/${room.slug || room.id}`} className="mt-3 flex flex-col">
        {/* Line 1: Location & Star Rating */}
        <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
          <span className="truncate pr-2">{branchName}</span>
          <span className="flex items-center gap-1 shrink-0 font-medium">
            <FiStar className="h-3.5 w-3.5 fill-slate-900 text-slate-900" />
            {room.rating > 0 ? Number(room.rating).toFixed(1) : "4.9"}
          </span>
        </div>

        {/* Line 2: Title */}
        <div className="text-sm font-semibold text-slate-800 truncate mt-0.5">
          {roomTitle}
        </div>

        {/* Line 3: Specs */}
        <div className="text-xs text-slate-500 truncate mt-0.5">
          {room.beds || "1 King bed"} · {room.capacity || room.guests || 2} guests
          {room.sizeSqm ? ` · ${room.sizeSqm} m²` : ""}
        </div>

        {/* Line 4: Dates / Availability status */}
        <div className="text-xs text-slate-500 mt-0.5">
          {isBooked ? (
            <span className="text-rose-600 font-medium">Currently booked</span>
          ) : (
            <span className="text-emerald-700 font-medium">Available now · Free cancellation</span>
          )}
        </div>

        {/* Line 5: Price */}
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-base font-extrabold text-slate-900">
            ₹{price.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-slate-500 font-normal">night</span>
        </div>
      </Link>
    </div>
  );
}
