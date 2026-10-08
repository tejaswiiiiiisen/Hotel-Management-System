import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { apiFetch } from "../../lib/api";

const DEFAULT_ROOMS = [
  {
    name: "Lakeside Suite",
    slug: "lakeside-suite",
    img: "/images/rooms/room-2.avif",
    guests: 2,
    price: "₹3,890",
    note: "per room incl. gourmet breakfast",
  },
  {
    name: "Garden Room",
    slug: "garden-room",
    img: "/images/rooms/room-3.avif",
    guests: 2,
    price: "₹2,490",
    note: "per room incl. breakfast",
  },
  {
    name: "Panorama Suite",
    slug: "panorama-suite",
    img: "/images/rooms/room-4.avif",
    guests: 3,
    price: "₹4,590",
    note: "per room incl. gourmet breakfast",
  },
];

export default function RoomsCarousel() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [i, setI] = useState(0);

  useEffect(() => {
    let active = true;

    const loadLocalRooms = () => {
      try {
        const stored = localStorage.getItem("hotel_rooms_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mapped = parsed.map((r: any, idx: number) => ({
              name: r.name || (r.number ? `Room ${r.number}` : `${r.type || "Standard"} Room`),
              slug: r.slug || `room-${r.number || r.id}`,
              img:
                r.image ||
                (Array.isArray(r.images) && r.images.length ? r.images[0] : null) ||
                `/images/rooms/room-${(idx % 4) + 1}.avif`,
              guests: Number(r.guests || r.capacity || 2),
              price: `₹${Number(r.price || r.pricePerNight || 2500).toLocaleString("en-IN")}`,
              note: "per room incl. breakfast",
            }));
            setRooms(mapped);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to parse local rooms in carousel:", err);
      }
    };

    apiFetch("/api/rooms")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data && Array.isArray(data.rooms) && data.rooms.length > 0) {
          const mapped = data.rooms.map((r: any, idx: number) => ({
            name: r.name,
            slug: r.slug || `room-${r.number || r.id}`,
            img:
              r.image ||
              (Array.isArray(r.images) && r.images.length ? r.images[0] : null) ||
              `/images/rooms/room-${(idx % 4) + 1}.avif`,
            guests: Number(r.guests || r.capacity || 2),
            price: `₹${Number(r.pricePerNight || r.price || 2500).toLocaleString("en-IN")}`,
            note: "per room incl. breakfast",
          }));
          setRooms(mapped);
        } else {
          loadLocalRooms();
        }
      })
      .catch(() => {
        if (active) loadLocalRooms();
      });

    return () => {
      active = false;
    };
  }, []);

  const n = rooms.length;
  const go = (dir: number) => setI((p) => (p + dir + n) % n);

  const current = rooms[i] || DEFAULT_ROOMS[0];
  const prev = rooms[(i - 1 + n) % n] || DEFAULT_ROOMS[0];
  const next = rooms[(i + 1) % n] || DEFAULT_ROOMS[0];

  return (
    <section className="relative overflow-hidden bg-cream pb-24">
      <div className="relative flex items-stretch justify-center gap-4">
        {/* Left peek */}
        <div className="relative hidden h-[440px] flex-1 overflow-hidden rounded-lg lg:block">
          <img src={prev.img} alt={prev.name} className="absolute inset-0 h-full w-full object-cover" />
        </div>

        {/* Center featured room */}
        <div className="w-full max-w-3xl shrink-0 px-4 sm:px-0">
          <div className="relative h-[440px] overflow-hidden rounded-xl">
            <img
              src={current.img}
              alt={current.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Enquire / Book overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/contact")}
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              >
                Enquire
              </button>
              <Link
                to={`/booking?room=${current.slug}`}
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Book
              </Link>
            </div>
          </div>

          {/* Caption */}
          <h3 className="mt-6 text-[clamp(30px,4vw,44px)] font-extrabold text-navy">
            {current.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-[#6b7280]">
            <span>{current.guests} guests</span>
            <span>
              <span className="font-bold text-navy">FROM {current.price}</span>{" "}
              {current.note}
            </span>
          </div>
          <Link
            to={`/rooms/${current.slug}`}
            className="mt-3 inline-block text-[13px] font-semibold text-navy underline-offset-4 hover:underline"
          >
            View details
          </Link>
        </div>

        {/* Right peek */}
        <div className="relative hidden h-[440px] flex-1 overflow-hidden rounded-lg lg:block">
          <img src={next.img} alt={next.name} className="absolute inset-0 h-full w-full object-cover" />
        </div>

        {/* Prev / next arrows */}
        <button
          type="button"
          aria-label="Previous room"
          onClick={() => go(-1)}
          className="absolute left-2 top-[200px] z-20 grid h-11 w-11 place-items-center rounded-full border border-[#d9d9e3] bg-white/90 text-navy backdrop-blur transition-colors hover:border-transparent hover:bg-brand hover:text-white lg:left-[16%]"
        >
          <FiArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next room"
          onClick={() => go(1)}
          className="absolute right-2 top-[200px] z-20 grid h-11 w-11 place-items-center rounded-full border border-[#d9d9e3] bg-white/90 text-navy backdrop-blur transition-colors hover:border-transparent hover:bg-brand hover:text-white lg:right-[16%]"
        >
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
