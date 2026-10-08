import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiX,
  FiSliders,
  FiChevronDown,
  FiGrid,
  FiList,
  FiMapPin,
  FiGlobe,
  FiUsers,
  FiMinus,
  FiPlus,
  FiCalendar,
  FiRotateCcw,
} from "react-icons/fi";
import RoomRow from "./RoomRow";
import RoomCard from "./RoomCard";
import RoomQuickViewModal from "./RoomQuickViewModal";
import AirbnbFiltersModal from "./AirbnbFiltersModal";
import { apiFetch } from "../../lib/api";

const CATEGORIES = [
  {
    id: "ALL",
    label: "All Rooms",
    image: "/images/rooms/room-1.avif",
  },
  {
    id: "Deluxe",
    label: "Deluxe",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "Super Deluxe",
    label: "Super Deluxe",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "Suite",
    label: "Executive Suite",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "Presidential Suite",
    label: "Presidential Suite",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "Standard",
    label: "Standard",
    image: "/images/rooms/room-3.avif",
  },
];

const SORTS = [
  { value: "newest", label: "Recommended" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const ALL_PROPERTIES_OPTION = { orgId: "", name: "All Branches", code: "ALL" };

export default function RoomsBrowser() {
  const [selectedOrg, setSelectedOrg] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("orgId") || params.get("org") || "";
  });
  const [orgList, setOrgList] = useState<any[]>([ALL_PROPERTIES_OPTION]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Filter States
  const [types, setTypes] = useState(new Set<string>());
  const [amenities, setAmenities] = useState(new Set<string>());
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dates state
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);

  // Popover States for Search Capsule
  const [activeCapsuleTab, setActiveCapsuleTab] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const capsuleRef = useRef<HTMLDivElement>(null);

  // Rooms Data
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewRoom, setQuickViewRoom] = useState<any | null>(null);

  // Total guests
  const totalGuests = adults + childrenCount;

  // Load organizations
  useEffect(() => {
    let active = true;
    apiFetch("/api/organizations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.organizations) && d.organizations.length > 0) {
          const apiOrgs = d.organizations
            .filter((o: any) => !o.status || o.status === "Active")
            .map((o: any) => ({
              orgId: o.orgId || o.org_id,
              name: o.name,
              code: o.orgId || o.org_id,
              logoUrl: o.logoUrl || o.logo_url || "",
              location: o.location || o.place || "",
            }));

          const map = new Map();
          [ALL_PROPERTIES_OPTION, ...apiOrgs].forEach((o) => {
            if (o && o.orgId !== undefined && !map.has(o.orgId)) {
              map.set(o.orgId, o);
            }
          });
          setOrgList(Array.from(map.values()));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Close capsule popover on outside click
  useEffect(() => {
    if (!activeCapsuleTab) return;
    function onClick(e: MouseEvent) {
      if (capsuleRef.current && capsuleRef.current.contains(e.target as Node)) {
        return;
      }
      setActiveCapsuleTab(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [activeCapsuleTab]);

  // Query String Calculation
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (selectedOrg) p.set("orgId", selectedOrg);
    if (searchQuery) p.set("search", searchQuery);
    if (selectedCategory && selectedCategory !== "ALL") p.set("type", selectedCategory);
    else if (types.size) p.set("type", [...types].join(","));
    if (amenities.size) p.set("amenities", [...amenities].join(","));
    if (totalGuests > 1) p.set("guests", String(totalGuests));
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (sort !== "newest") p.set("sort", sort);

    const newUrl = window.location.pathname + (p.toString() ? "?" + p.toString() : "");
    window.history.replaceState({}, "", newUrl);

    return p.toString();
  }, [selectedOrg, searchQuery, selectedCategory, types, amenities, totalGuests, minPrice, maxPrice, sort]);

  // Fetch Rooms
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const t = setTimeout(() => {
      apiFetch(`/api/rooms?${queryString}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((d) => {
          if (!active) return;
          const roomsArr = Array.isArray(d) ? d : d && Array.isArray(d.rooms) ? d.rooms : null;
          if (roomsArr && roomsArr.length > 0) {
            let mapped = roomsArr.map((r: any) => ({
              ...r,
              available: r.status ? r.status.toLowerCase() === "available" : !r.booking,
            }));

            if (showAvailableOnly) {
              mapped = mapped.filter((r: any) => r.available);
            }

            if (sort === "price_asc") {
              mapped.sort(
                (a: any, b: any) =>
                  Number(a.pricePerNight || a.price || 0) -
                  Number(b.pricePerNight || b.price || 0)
              );
            } else if (sort === "price_desc") {
              mapped.sort(
                (a: any, b: any) =>
                  Number(b.pricePerNight || b.price || 0) -
                  Number(a.pricePerNight || a.price || 0)
              );
            } else if (sort === "rating") {
              mapped.sort(
                (a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0)
              );
            } else {
              mapped.sort(
                (a: any, b: any) => (b.available ? 1 : 0) - (a.available ? 1 : 0)
              );
            }

            setRooms(mapped);
          } else {
            setRooms([]);
          }
        })
        .catch(() => {
          if (!active) return;
          setRooms([]);
          setError("Failed to load rooms. Please refresh.");
        })
        .finally(() => active && setLoading(false));
    }, 250);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [queryString, showAvailableOnly, sort]);

  const activeOrgObj = useMemo(() => {
    return orgList.find((o) => o.orgId === selectedOrg) || ALL_PROPERTIES_OPTION;
  }, [orgList, selectedOrg]);

  const filterCount =
    (selectedOrg ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    types.size +
    amenities.size +
    (totalGuests > 1 ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (showAvailableOnly ? 1 : 0);

  function resetAll() {
    setSelectedOrg("");
    setSearchQuery("");
    setSelectedCategory("ALL");
    setShowAvailableOnly(false);
    setTypes(new Set());
    setAmenities(new Set());
    setAdults(1);
    setChildrenCount(0);
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
  }

  return (
    <div className="font-sans space-y-7">
      {/* 1. AIRBNB STICKY / FLOATING SEARCH CAPSULE */}
      <div className="flex justify-center w-full">
        <div
          ref={capsuleRef}
          className="relative flex flex-col md:flex-row items-center w-full max-w-4xl rounded-3xl md:rounded-full bg-white border border-slate-200/90 shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-2 md:p-1.5"
        >
          {/* Section A: Destination / Branch */}
          <div className="relative w-full md:w-5/12">
            <button
              type="button"
              onClick={() =>
                setActiveCapsuleTab(activeCapsuleTab === "branch" ? null : "branch")
              }
              className={`w-full text-left px-5 py-2.5 rounded-full transition-colors cursor-pointer ${
                activeCapsuleTab === "branch"
                  ? "bg-slate-100 shadow-xs"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="text-[11px] font-bold text-slate-900 tracking-wide">
                Where
              </div>
              <div className="text-xs font-medium text-slate-500 truncate">
                {selectedOrg ? activeOrgObj.name : "Search all branches"}
              </div>
            </button>

            {/* Branch Dropdown */}
            {activeCapsuleTab === "branch" && (
              <div className="absolute left-0 top-full mt-3 w-full sm:w-80 rounded-3xl bg-white p-3 shadow-2xl border border-slate-100 z-50 animate-fade-in">
                <div className="text-xs font-bold text-slate-400 px-3 py-1.5 uppercase">
                  Select Hotel Branch
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrg("");
                    setActiveCapsuleTab(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs font-bold transition-colors ${
                    !selectedOrg
                      ? "bg-slate-900 text-white"
                      : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiGlobe className="h-4 w-4" />
                    <span>All Hotel Branches</span>
                  </div>
                </button>

                <div className="my-1.5 h-px bg-slate-100" />

                {orgList
                  .filter((o) => o.orgId)
                  .map((org) => {
                    const isSelected = selectedOrg === org.orgId;
                    return (
                      <button
                        key={org.orgId}
                        type="button"
                        onClick={() => {
                          setSelectedOrg(org.orgId);
                          setActiveCapsuleTab(null);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-slate-900 text-white font-bold"
                            : "text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FiMapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{org.name}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="hidden md:block h-8 w-px bg-slate-200" />

          {/* Section B: Dates (Check in / Check out) */}
          <div className="relative w-full md:w-4/12">
            <button
              type="button"
              onClick={() =>
                setActiveCapsuleTab(activeCapsuleTab === "dates" ? null : "dates")
              }
              className={`w-full text-left px-5 py-2.5 rounded-full transition-colors cursor-pointer ${
                activeCapsuleTab === "dates"
                  ? "bg-slate-100 shadow-xs"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="text-[11px] font-bold text-slate-900 tracking-wide">
                Stay dates
              </div>
              <div className="text-xs font-medium text-slate-500 truncate">
                {checkInDate ? `${checkInDate} to ${checkOutDate}` : "Add dates"}
              </div>
            </button>

            {/* Dates Popover */}
            {activeCapsuleTab === "dates" && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-80 rounded-3xl bg-white p-5 shadow-2xl border border-slate-100 z-50 animate-fade-in">
                <div className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FiCalendar className="h-4 w-4 text-slate-500" /> Choose Stay Dates
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveCapsuleTab(null)}
                  className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <div className="hidden md:block h-8 w-px bg-slate-200" />

          {/* Section C: Who / Guests & Search Button */}
          <div className="relative w-full md:w-5/12 flex items-center justify-between pl-3 pr-2 py-1">
            <button
              type="button"
              onClick={() =>
                setActiveCapsuleTab(activeCapsuleTab === "guests" ? null : "guests")
              }
              className={`flex-1 text-left px-3 py-2 rounded-full transition-colors cursor-pointer ${
                activeCapsuleTab === "guests"
                  ? "bg-slate-100 shadow-xs"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="text-[11px] font-bold text-slate-900 tracking-wide">
                Who
              </div>
              <div className="text-xs font-medium text-slate-500 truncate">
                {totalGuests > 1 ? `${totalGuests} guests` : "1 guest"}
              </div>
            </button>

            {/* Guests Popover */}
            {activeCapsuleTab === "guests" && (
              <div className="absolute right-0 top-full mt-3 w-80 rounded-3xl bg-white p-5 shadow-2xl border border-slate-100 z-50 animate-fade-in">
                <div className="space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Adults</div>
                      <div className="text-[11px] text-slate-400">Ages 13 or above</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAdults((a) => Math.max(1, a - 1))}
                        disabled={adults <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 disabled:opacity-30 hover:border-slate-800"
                      >
                        <FiMinus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults((a) => a + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-slate-800"
                      >
                        <FiPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Children</div>
                      <div className="text-[11px] text-slate-400">Ages 2–12</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setChildrenCount((c) => Math.max(0, c - 1))}
                        disabled={childrenCount <= 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 disabled:opacity-30 hover:border-slate-800"
                      >
                        <FiMinus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">
                        {childrenCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChildrenCount((c) => c + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-slate-800"
                      >
                        <FiPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveCapsuleTab(null)}
                  className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* Circular Search Icon Button */}
            <button
              type="button"
              onClick={() => setActiveCapsuleTab(null)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-95 transition-all ml-2"
              title="Search"
            >
              <FiSearch className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. AIRBNB HORIZONTAL CATEGORIES BAR & FILTERS BUTTON */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        {/* Horizontal Category Icons List with Luxury Image Avatars */}
        <div className="flex items-center gap-4 sm:gap-7 overflow-x-auto scrollbar-none py-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`group flex flex-col items-center gap-2 shrink-0 pb-2 cursor-pointer transition-all border-b-2 ${
                  isSelected
                    ? "border-slate-900 font-bold"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                }`}
              >
                <div
                  className={`relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? "ring-2 ring-slate-900 ring-offset-2 scale-105 shadow-md"
                      : "ring-1 ring-slate-200 opacity-80 group-hover:opacity-100 group-hover:scale-105 group-hover:ring-slate-400 shadow-2xs"
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div
                    className={`absolute inset-0 bg-black/10 transition-opacity ${
                      isSelected ? "opacity-0" : "group-hover:opacity-0"
                    }`}
                  />
                </div>
                <span
                  className={`text-[11px] sm:text-xs tracking-tight whitespace-nowrap transition-colors ${
                    isSelected ? "text-slate-900 font-extrabold" : "text-slate-600 font-semibold"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 hover:border-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <FiSliders className="h-3.5 w-3.5" />
            <span>Filters</span>
            {filterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-extrabold">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. SUB-HEADER: Result Count, Sort, and Grid/List Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 font-medium">
        <div>
          {loading ? (
            <span>Searching rooms…</span>
          ) : (
            <span className="font-semibold text-slate-800">
              Showing {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
              {selectedOrg && ` in ${activeOrgObj.name}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Reset Filters shortcut if applied */}
          {filterCount > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FiRotateCcw className="h-3 w-3" /> Clear filters
            </button>
          )}

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-400 cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5 pointer-events-none" />
          </div>

          {/* Grid / List Switcher */}
          <div className="flex items-center rounded-xl border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-900 text-white"
                  : "text-slate-400 hover:text-slate-900"
              }`}
            >
              <FiGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-slate-900 text-white"
                  : "text-slate-400 hover:text-slate-900"
              }`}
            >
              <FiList className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. ROOMS CARD GRID */}
      {error ? (
        <div className="rounded-3xl bg-red-50 p-8 text-center text-red-600 border border-red-200">
          <p className="font-bold">{error}</p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white"
          >
            Reset
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col space-y-3">
              <div className="aspect-[20/19] rounded-3xl bg-slate-200" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-200 rounded" />
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 p-16 text-center">
          <h3 className="text-lg font-bold text-slate-900">No rooms found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Try adjusting your search criteria, clearing filters, or exploring all hotel branches.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onQuickView={(r) => setQuickViewRoom(r)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto">
          {rooms.map((room, i) => (
            <RoomRow
              key={room.id}
              room={room}
              reverse={i % 2 === 1}
              index={i}
              onQuickView={(r) => setQuickViewRoom(r)}
            />
          ))}
        </div>
      )}

      {/* 5. AIRBNB FILTERS MODAL */}
      <AirbnbFiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        types={types}
        setTypes={setTypes}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        amenities={amenities}
        setAmenities={setAmenities}
        showAvailableOnly={showAvailableOnly}
        setShowAvailableOnly={setShowAvailableOnly}
        onReset={resetAll}
        totalRoomsCount={rooms.length}
      />

      {/* 6. QUICK VIEW MODAL */}
      {quickViewRoom && (
        <RoomQuickViewModal
          room={quickViewRoom}
          onClose={() => setQuickViewRoom(null)}
        />
      )}
    </div>
  );
}
