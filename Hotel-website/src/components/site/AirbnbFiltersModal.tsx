import { useState, useEffect } from "react";
import { FiX, FiCheck } from "react-icons/fi";

interface AirbnbFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  types: Set<string>;
  setTypes: (val: Set<string>) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  amenities: Set<string>;
  setAmenities: (val: Set<string>) => void;
  showAvailableOnly: boolean;
  setShowAvailableOnly: (val: boolean) => void;
  onReset: () => void;
  totalRoomsCount: number;
}

const ROOM_TYPES = [
  {
    id: "Standard",
    name: "Standard Room",
    desc: "Cozy comfortable essentials for solo/couples",
    image: "/images/rooms/room-3.avif",
  },
  {
    id: "Deluxe",
    name: "Deluxe Room",
    desc: "Spacious layout with premium furnishings",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "Super Deluxe",
    name: "Super Deluxe",
    desc: "Elevated luxury with stunning ambient views",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "Suite",
    name: "Executive Suite",
    desc: "Separate living space with luxury amenities",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "Presidential Suite",
    name: "Presidential Suite",
    desc: "Top-floor grand royal living experience",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=300&q=80",
  },
];

const AMENITY_OPTIONS = [
  "Free Wi-Fi",
  "Air Conditioning",
  "TV",
  "Room Service",
  "King Bed",
  "Private Bathroom",
  "Mini Bar",
  "Balcony",
  "Palace View",
  "Lake View",
];

export default function AirbnbFiltersModal({
  isOpen,
  onClose,
  types,
  setTypes,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  amenities,
  setAmenities,
  showAvailableOnly,
  setShowAvailableOnly,
  onReset,
  totalRoomsCount,
}: AirbnbFiltersModalProps) {
  const [localTypes, setLocalTypes] = useState<Set<string>>(new Set(types));
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [localAmenities, setLocalAmenities] = useState<Set<string>>(new Set(amenities));
  const [localAvailable, setLocalAvailable] = useState(showAvailableOnly);

  useEffect(() => {
    if (isOpen) {
      setLocalTypes(new Set(types));
      setLocalMin(minPrice);
      setLocalMax(maxPrice);
      setLocalAmenities(new Set(amenities));
      setLocalAvailable(showAvailableOnly);
    }
  }, [isOpen, types, minPrice, maxPrice, amenities, showAvailableOnly]);

  if (!isOpen) return null;

  const toggleType = (t: string) => {
    const next = new Set(localTypes);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setLocalTypes(next);
  };

  const toggleAmenity = (a: string) => {
    const next = new Set(localAmenities);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    setLocalAmenities(next);
  };

  const handleApply = () => {
    setTypes(localTypes);
    setMinPrice(localMin);
    setMaxPrice(localMax);
    setAmenities(localAmenities);
    setShowAvailableOnly(localAvailable);
    onClose();
  };

  const handleReset = () => {
    setLocalTypes(new Set());
    setLocalMin("");
    setLocalMax("");
    setLocalAmenities(new Set());
    setLocalAvailable(false);
    onReset();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
          <h2 className="text-base font-bold text-slate-900">Filters</h2>
          <div className="w-8" />
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 py-6 space-y-8 divide-y divide-slate-100">
          {/* Price Range Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Price range</h3>
            <p className="text-xs text-slate-500 mb-4">Nightly room rates before taxes</p>

            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-2xl border border-slate-300 p-3 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                <label className="block text-[11px] font-medium text-slate-500 uppercase">
                  Minimum
                </label>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-sm font-semibold text-slate-500">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <span className="text-slate-300 font-bold">–</span>

              <div className="flex-1 rounded-2xl border border-slate-300 p-3 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                <label className="block text-[11px] font-medium text-slate-500 uppercase">
                  Maximum
                </label>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-sm font-semibold text-slate-500">₹</span>
                  <input
                    type="number"
                    placeholder="15000"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Price Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: "Under ₹4,000", max: "4000", min: "" },
                { label: "₹4,000 – ₹7,000", min: "4000", max: "7000" },
                { label: "₹7,000+", min: "7000", max: "" },
              ].map((preset) => {
                const isActive =
                  localMin === preset.min && localMax === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLocalMin(preset.min);
                      setLocalMax(preset.max);
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type of Room Section */}
          <div className="pt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Room category</h3>
            <p className="text-xs text-slate-500 mb-4">Choose preferred accommodation level</p>

            <div className="space-y-3">
              {ROOM_TYPES.map((t) => {
                const checked = localTypes.has(t.id);
                return (
                  <label
                    key={t.id}
                    onClick={() => toggleType(t.id)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <img
                        src={t.image}
                        alt={t.name}
                        className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.desc}</div>
                      </div>
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        checked
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {checked && <FiCheck className="h-4 w-4" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Instant availability</h3>
                <p className="text-xs text-slate-500">Only show rooms ready for immediate check-in</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalAvailable(!localAvailable)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  localAvailable ? "bg-slate-900" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    localAvailable ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Amenities Section */}
          <div className="pt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Amenities</h3>
            <p className="text-xs text-slate-500 mb-4">Features included with the room</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const checked = localAmenities.has(amenity);
                return (
                  <label
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-slate-400 cursor-pointer transition-all"
                  >
                    <span className="text-sm font-medium text-slate-800">{amenity}</span>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        checked
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {checked && <FiCheck className="h-3.5 w-3.5" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-white">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm font-bold text-slate-900 underline hover:opacity-75 cursor-pointer"
          >
            Clear all
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-black transition-all shadow-md active:scale-95"
          >
            Show {totalRoomsCount} rooms
          </button>
        </div>
      </div>
    </div>
  );
}
