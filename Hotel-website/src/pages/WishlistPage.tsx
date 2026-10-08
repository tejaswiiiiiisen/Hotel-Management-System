
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiStar, FiMapPin, FiCalendar, FiTrash2, FiCheck, FiX, FiInfo } from "react-icons/fi";
import { FaBed, FaBath, FaWifi, FaCoffee } from "react-icons/fa";
import PageHeader from "../components/site/PageHeader";
import SiteFooter from "../components/site/SiteFooter";
import { useWishlist } from "../context/WishlistContext";
import { showError, showInfo } from "../utils/toast";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const navigate = useNavigate();

  const handleBookNow = (room: any) => {
    // Check if room is available
    if (room.status === "unavailable" || room.available === false) {
      showInfo("This room is not available for the selected dates.");
      return;
    }
    navigate(`/booking?room=${room.slug}`);
  };

  return (
    <div className="min-h-screen bg-cream font-jost selection:bg-brand/20 selection:text-brand">
      <PageHeader />
      <div className="bg-navy py-12 text-center text-white">
        <h1 className="text-3xl font-bold tracking-widest uppercase">My Wishlist</h1>
        <p className="mt-2 text-sm text-white/70">Your curated collection of luxury rooms and suites.</p>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <FiHeart className="h-10 w-10 fill-current" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-navy">Your Wishlist is Empty</h2>
            <p className="mb-8 max-w-md text-slate-500">
              You haven&apos;t saved any rooms yet. Browse our collection and click the heart icon to add rooms here.
            </p>
            <Link
              to="/rooms"
              className="rounded-full bg-brand px-8 py-3 font-bold uppercase tracking-wide text-white transition hover:opacity-90 shadow-lg shadow-brand/30"
            >
              Explore Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-navy">
                Saved Rooms ({wishlist.length})
              </h2>
              <button
                onClick={clearWishlist}
                className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {wishlist.map((room) => {
                const isAvailable = room.status !== "unavailable" && room.available !== false;

                return (
                  <div
                    key={room.id}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md sm:flex-row border border-slate-100"
                  >
                    {/* Image */}
                    <div className="relative h-64 w-full shrink-0 overflow-hidden sm:h-auto sm:w-72 lg:w-96">
                      <img
                        src={room.image || "/images/rooms/room-1.avif"}
                        alt={room.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute right-4 top-4">
                        <button
                          onClick={() => removeFromWishlist(room.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow backdrop-blur transition hover:bg-rose-500 hover:text-white"
                          title="Remove from wishlist"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md \${
                            isAvailable
                              ? "bg-emerald-500/90 text-white"
                              : "bg-rose-500/90 text-white"
                          }`}
                        >
                          {isAvailable ? (
                            <>
                              <FiCheck className="h-3 w-3" /> Available
                            </>
                          ) : (
                            <>
                              <FiX className="h-3 w-3" /> Unavailable
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                              {room.type}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                              <FiStar className="fill-current" />
                              <span>{(room.rating || 5.0).toFixed(1)}</span>
                            </div>
                          </div>
                          <h3 className="mb-2 text-2xl font-bold text-navy line-clamp-1">
                            {room.name}
                          </h3>
                          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                            <FiMapPin className="h-4 w-4" />
                            <span>{room.branch_id || "Main Branch"}</span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-3xl font-bold text-brand">
                            ?{room.pricePerNight}
                          </div>
                          <div className="text-sm text-slate-500">per night</div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="mb-6 flex flex-wrap gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <FaBed className="text-slate-400" />
                          <span>King Bed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaBath className="text-slate-400" />
                          <span>Bathtub</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaWifi className="text-slate-400" />
                          <span>Free Wi-Fi</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCoffee className="text-slate-400" />
                          <span>Breakfast</span>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                        <Link
                          to={`/rooms/\${room.slug}`}
                          className="flex-1 rounded-full border-2 border-brand px-6 py-2.5 text-center text-sm font-bold uppercase tracking-wider text-brand transition hover:bg-brand hover:text-white"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleBookNow(room)}
                          className="flex-1 rounded-full bg-brand px-6 py-2.5 text-center text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-brand/30 transition hover:opacity-90"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

