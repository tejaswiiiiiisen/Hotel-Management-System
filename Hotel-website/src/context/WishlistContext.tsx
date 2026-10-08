import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { showSuccess, showError, showInfo } from "../utils/toast";
import AuthModal from "../components/site/AuthModal";
import type { Room } from "../types";

export interface WishlistItem {
  id: number;
  slug: string;
  name: string;
  type: string;
  pricePerNight: number;
  image?: string;
  shortDescription?: string;
  rating?: number;
  status?: string;
  available?: boolean;
  branch_id?: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  wishlistCount: number;
  isInWishlist: (id: number) => boolean;
  toggleWishlist: (room: Partial<Room> & { id: number; name: string; slug: string }) => void;
  removeFromWishlist: (id: number) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<any>(null);

  const fetchWishlist = () => {
    if (sessionStorage.getItem("user_logged_in") === "true") {
      apiFetch("/api/wishlist")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.rooms)) {
            const dbWishlist: WishlistItem[] = data.rooms.map((room: any) => ({
              id: room.id,
              slug: room.slug,
              name: room.name,
              type: room.type || "Room",
              pricePerNight: room.pricePerNight || 0,
              image: room.image || room.heroImage || "",
              rating: room.rating || 5.0,
              status: room.status,
              available: room.available
            }));
            setWishlist(dbWishlist);
          }
        })
        .catch(() => {});
    } else {
      setWishlist([]);
    }
  };

  // Fetch wishlist on mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  const isInWishlist = (id: number) => {
    return wishlist.some((item) => item.id === id);
  };

  const toggleWishlist = async (room: Partial<Room> & { id: number; name: string; slug: string }) => {
    if (sessionStorage.getItem("user_logged_in") !== "true") {
      showError("Please login or create an account to save rooms to your wishlist.");
      setPendingRoom(room);
      setShowAuthModal(true);
      return;
    }

    const exists = isInWishlist(room.id);

    if (exists) {
      await removeFromWishlist(room.id);
    } else {
      try {
        const res = await apiFetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room.id }),
        });
        const data = await res.json();
        
        if (res.status === 409 || data.error?.includes("already")) {
          showInfo("This room is already in your wishlist.");
          fetchWishlist(); // sync just in case
          return;
        }
        
        if (!res.ok) {
          throw new Error(data.error || "Failed");
        }

        showSuccess("Room added to wishlist.");
        fetchWishlist();
      } catch (err) {
        showError("Unable to add room to wishlist. Please try again.");
      }
    }
  };

  const removeFromWishlist = async (id: number) => {
    if (sessionStorage.getItem("user_logged_in") !== "true") return;

    try {
      const res = await apiFetch(`/api/wishlist/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      
      showSuccess("Room removed from wishlist.");
      fetchWishlist();
    } catch (err) {
      showError("Unable to remove room from wishlist. Please try again.");
    }
  };

  const clearWishlist = async () => {
    if (sessionStorage.getItem("user_logged_in") !== "true") return;

    try {
      await apiFetch("/api/wishlist", { method: "DELETE" });
      fetchWishlist();
    } catch (err) {
      // ignore
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
      {showAuthModal && (
        <AuthModal 
          onClose={() => {
            setShowAuthModal(false);
            setPendingRoom(null);
          }} 
          onSuccess={() => {
            setShowAuthModal(false);
            fetchWishlist();
            if (pendingRoom) {
              toggleWishlist(pendingRoom);
              setPendingRoom(null);
            }
          }}
        />
      )}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
