import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { showInfo } from "../../utils/toast";
import AuthModal from "./AuthModal";
import {
  FiHeart,
  FiBell,
  FiX,
  FiTrash2,
  FiExternalLink,
  FiCheck,
  FiGift,
  FiInfo,
  FiCalendar,
} from "react-icons/fi";
import AccountControl from "./AccountControl";
import { useWishlist } from "../../context/WishlistContext";
import { useNotification } from "../../context/NotificationContext";

interface HeaderActionsProps {
  variant?: "dark" | "light";
  className?: string;
}

export default function HeaderActions({
  variant = "light",
  className = "",
}: HeaderActionsProps) {
  const navigate = useNavigate();
  const { wishlist, wishlistCount, removeFromWishlist, clearWishlist } = useWishlist();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotification();

  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const guard = (action: () => void, msg?: string) => {
    const isLoggedIn =
      sessionStorage.getItem("website_user_logged_in") === "true" ||
      localStorage.getItem("website_user_logged_in") === "true" ||
      sessionStorage.getItem("user_logged_in") === "true";

    if (!isLoggedIn) {
      if (msg) showInfo(msg);
      setPendingAction(() => action);
      setShowAuthModal(true);
    } else {
      action();
    }
  };

  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    if (!showNotifDropdown) return;
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifDropdown]);

  const isDark = variant === "dark";

  const btnBaseStyle = isDark
    ? "text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 shadow-sm"
    : "text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/80 shadow-2xs";

  return (
    <div className={`flex items-center gap-2 sm:gap-5 ${className}`}>
      {/* 1. WISHLIST ICON BUTTON */}
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => guard(() => { setShowNotifDropdown(false); navigate("/wishlist"); }, "Please login or create an account to view your wishlist.")}
          aria-label="Wishlist"
          title="Saved Rooms (Wishlist)"
          className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${btnBaseStyle}`}
        >
          <FiHeart className="h-5 w-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
              {wishlistCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. NOTIFICATION ICON BUTTON */}
      <div ref={notifRef} className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => guard(() => { setShowNotifDropdown((prev) => !prev); setShowWishlistDrawer(false); })}
          aria-label="Notifications"
          title="Notifications"
          className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${btnBaseStyle}`}
        >
          <FiBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* NOTIFICATION DROPDOWN MENU */}
        {showNotifDropdown && (
          <div className="fixed right-6 top-[76px] z-[1000] w-[min(560px,calc(100vw-48px))] min-h-[min(560px,calc(100vh-100px))] max-h-[90vh] overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 font-jost">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-navy text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  <FiCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="mt-3 flex-1 max-h-[calc(90vh-150px)] overflow-y-auto space-y-3 pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No notifications available
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`group relative flex gap-3 rounded-xl p-3 text-left transition-all ${
                      notif.read ? "bg-slate-50/60" : "bg-blue-50/40 border border-blue-100"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === "offer" ? (
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-rose-100 text-rose-600">
                          <FiGift className="h-4 w-4" />
                        </div>
                      ) : notif.type === "booking" ? (
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                          <FiCalendar className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-100 text-sky-600">
                          <FiInfo className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold ${notif.read ? "text-slate-700" : "text-navy"}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <Link
                          to={notif.link}
                          onClick={() => setShowNotifDropdown(false)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                        >
                          View Details <FiExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1 cursor-pointer"
                      title="Delete notification"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. USER ACCOUNT CONTROL */}
      <AccountControl variant={variant} />

      {/* WISHLIST DRAWER MODAL */}
      {showWishlistDrawer && (
        <div className="fixed inset-0 z-[1000] flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl animate-in slide-in-from-right duration-300 font-jost text-navy">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FiHeart className="h-5 w-5 text-rose-500 fill-rose-500" />
                <h2 className="text-xl font-bold">My Wishlist</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  {wishlistCount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowWishlistDrawer(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {wishlist.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-400 mb-4">
                    <FiHeart className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-navy">Your Wishlist is empty</h3>
                  <p className="mt-1 text-sm text-slate-500 max-w-xs">
                    Save your favorite rooms and luxury suites to compare and book later.
                  </p>
                  <Link
                    to="/rooms"
                    onClick={() => setShowWishlistDrawer(false)}
                    className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Browse Luxury Rooms
                  </Link>
                </div>
              ) : (
                wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="group flex gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs transition-shadow hover:shadow-md"
                  >
                    <div className="h-20 w-24 overflow-hidden rounded-xl bg-slate-100 shrink-0 relative">
                      <img
                        src={item.image || "/images/rooms/room-1.avif"}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-navy text-sm line-clamp-1">{item.name}</h4>
                          <button
                            type="button"
                            onClick={() => removeFromWishlist(item.id)}
                            className="text-slate-400 transition-colors hover:text-rose-500 p-1 cursor-pointer"
                            title="Remove from wishlist"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-xs text-slate-400">{item.type}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                        <span className="text-sm font-bold text-navy">
                          €{item.pricePerNight} <span className="text-[10px] font-normal text-slate-400">/ night</span>
                        </span>
                        <Link
                          to={`/rooms/${item.slug}`}
                          onClick={() => setShowWishlistDrawer(false)}
                          className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {wishlist.length > 0 && (
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
                <Link
                  to="/rooms"
                  onClick={() => setShowWishlistDrawer(false)}
                  className="rounded-full bg-navy px-5 py-2.5 text-xs font-semibold text-white hover:bg-opacity-90"
                >
                  Explore More Rooms
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
