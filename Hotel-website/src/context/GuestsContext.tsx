import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Guest } from "../types";
import { apiFetch } from "../lib/api";

// App-wide list of guests the user has added via the booking bar. Shared so the
// account dropdown can list the same people.
//
// When the user is signed in, guests live in the database under their account
// (GET/POST/DELETE /api/guests) so the backend always knows whose guest each is.
// When signed out, we fall back to localStorage so the booking bar still works
// before login; that local list survives reloads on the same device.
interface GuestsContextValue {
  guests: Guest[];
  addGuest: (g: Omit<Guest, "id">) => void;
  removeGuest: (id: number) => void;
}

const GuestsContext = createContext<GuestsContextValue | null>(null);
const STORAGE_KEY = "hotel_guests";

function loadLocal(): Guest[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Guest[]) : [];
  } catch {
    return [];
  }
}

export function GuestsProvider({ children }: { children: ReactNode }) {
  const [guests, setGuests] = useState<Guest[]>(loadLocal);
  // null = still checking, true = signed in (use DB), false = guest/localStorage.
  const [authed, setAuthed] = useState<boolean | null>(null);

  // On mount, try to load the user's guests from the API. A 200 means they're
  // signed in — switch to DB-backed mode. A 401 means signed out — stay on the
  // localStorage list we already loaded.
  useEffect(() => {
    let active = true;
    apiFetch("/api/guests")
      .then(async (r) => {
        if (!active) return;
        if (r.ok) {
          const data = await r.json();
          setAuthed(true);
          setGuests(Array.isArray(data.guests) ? data.guests : []);
        } else {
          setAuthed(false);
        }
      })
      .catch(() => {
        if (active) setAuthed(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist to localStorage only in signed-out mode. (When signed in the
  // database is the source of truth, so we don't shadow it with stale storage.)
  useEffect(() => {
    if (authed) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
    } catch {
      // storage may be unavailable (private mode) — non-fatal
    }
  }, [guests, authed]);

  async function addGuest(g: Omit<Guest, "id">) {
    if (authed) {
      try {
        const res = await apiFetch("/api/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(g),
        });
        if (res.ok) {
          const data = await res.json();
          setGuests((prev) => [...prev, data.guest as Guest]);
          return;
        }
      } catch {
        // fall through to local add so the UI still responds
      }
    }
    setGuests((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), ...g } as Guest,
    ]);
  }

  async function removeGuest(id: number) {
    if (authed) {
      try {
        await apiFetch(`/api/guests/${id}`, { method: "DELETE" });
      } catch {
        // ignore — we remove from the UI either way
      }
    }
    setGuests((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <GuestsContext.Provider value={{ guests, addGuest, removeGuest }}>
      {children}
    </GuestsContext.Provider>
  );
}

// Safe fallback if a consumer renders outside the provider.
export function useGuests(): GuestsContextValue {
  return (
    useContext(GuestsContext) || {
      guests: [],
      addGuest: () => {},
      removeGuest: () => {},
    }
  );
}
