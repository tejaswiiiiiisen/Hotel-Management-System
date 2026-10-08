import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiMaximize,
  FiStar,
  FiCheck,
  FiChevronRight,
  FiWifi,
  FiTv,
  FiWind,
  FiCoffee,
  FiShield,
  FiPhoneCall,
  FiShare2,
  FiClock,
  FiInfo,
  FiArrowLeft,
  FiX,
  FiMessageSquare,
  FiCheckCircle,
  FiMapPin,
  FiThumbsUp,
  FiLock,
  FiCalendar,
  FiHeart,
} from "react-icons/fi";
import { FaBed, FaBath, FaGlassMartiniAlt, FaConciergeBell, FaWhatsapp } from "react-icons/fa";
import PageHeader from "../components/site/PageHeader";
import SiteFooter from "../components/site/SiteFooter";
import { useWishlist } from "../context/WishlistContext";
import AuthModal from "../components/site/AuthModal";
import RoomCard from "../components/site/RoomCard";
import { apiFetch } from "../lib/api";
import { useTitle } from "../lib/useTitle";
import type { Room, Review } from "../types";

// Comprehensive fallback dataset for room details when API or localStorage is unavailable
const FALLBACK_ROOMS_DB: Record<string, Room & { detailedDescription?: string; viewType?: string; floorLevel?: string }> = {
  "lakeside-suite": {
    id: 101,
    name: "Lakeside Luxury Suite",
    slug: "lakeside-suite",
    type: "Suite",
    shortDescription: "Panoramic lake views with a private balcony, king bed, and marble Jacuzzi bathroom.",
    description:
      "Indulge in unmatched elegance with our Lakeside Luxury Suite. Designed with warm earth tones, handcrafted wooden furnishings, and floor-to-ceiling windows overlooking tranquil waters.",
    detailedDescription:
      "Indulge in unmatched elegance with our Lakeside Luxury Suite. Designed with warm earth tones, handcrafted wooden furnishings, and floor-to-ceiling windows overlooking tranquil waters. Enjoy private sunrise views from your expansive balcony, a master bedroom with a plush king-size bed, and a spacious marble bathroom equipped with a deep Jacuzzi tub and rain shower.",
    pricePerNight: 3890,
    capacity: 2,
    sizeSqm: 52,
    beds: "1 Super King Bed",
    viewType: "Panoramic Lake View",
    floorLevel: "3rd Floor (Executive Wing)",
    images: [
      "/images/rooms/room-2.avif",
      "/images/rooms/room-1.avif",
      "/images/rooms/room-3.avif",
      "/images/rooms/room-4.avif",
      "/images/rooms/5.webp",
    ],
    amenities: [
      "High-Speed Free Wi-Fi",
      "Private Lakeview Balcony",
      "Jacuzzi & Rain Shower",
      "55\" Smart UHD TV",
      "Nespresso Coffee Machine",
      "Stocked Minibar",
      "Dual-Zone Air Conditioning",
      "Soundproof Windows",
      "Electronic Laptop Safe",
      "24/7 Room Service",
      "Luxury Organic Bathrobes",
      "Complimentary Gourmet Breakfast",
    ],
    policies: [
      "Check-in: 02:00 PM | Check-out: 12:00 PM",
      "Free Cancellation up to 48 hours prior to check-in",
      "Non-smoking room throughout",
      "Extra bed available upon request (₹1,000/night)",
    ],
    rating: 4.9,
    reviewsCount: 18,
    available: true,
  },
  "garden-room": {
    id: 102,
    name: "Garden Deluxe Room",
    slug: "garden-room",
    type: "Deluxe",
    shortDescription: "Peaceful ground-floor retreat with lush garden terrace access and plush king bedding.",
    description:
      "Nestled among botanical gardens, the Garden Deluxe Room offers a calm and soothing atmosphere.",
    detailedDescription:
      "Nestled among botanical gardens, the Garden Deluxe Room offers a calm and soothing atmosphere. Featuring direct private terrace access, serene green views, natural light, high-performance soundproofing, and modern amenities crafted for deep relaxation.",
    pricePerNight: 2490,
    capacity: 2,
    sizeSqm: 38,
    beds: "1 King Bed / 2 Twin Beds",
    viewType: "Botanical Garden View",
    floorLevel: "Ground Floor",
    images: [
      "/images/rooms/room-3.avif",
      "/images/rooms/room-4.avif",
      "/images/rooms/room-5.avif",
      "/images/rooms/room-1.avif",
    ],
    amenities: [
      "High-Speed Free Wi-Fi",
      "Garden Terrace Access",
      "Ensuite Bath & Rain Shower",
      "43\" Smart HD TV",
      "Tea & Coffee Maker",
      "Air Conditioning",
      "In-room Safe",
      "Daily Housekeeping",
      "Plush Slippers & Towels",
    ],
    policies: [
      "Check-in: 02:00 PM | Check-out: 11:00 AM",
      "Free Cancellation up to 24 hours prior to check-in",
      "Non-smoking room",
      "Children under 6 stay free using existing beds",
    ],
    rating: 4.8,
    reviewsCount: 12,
    available: true,
  },
  "panorama-suite": {
    id: 103,
    name: "Panorama Executive Suite",
    slug: "panorama-suite",
    type: "Executive Suite",
    shortDescription: "Corner suite offering 270-degree mountain vistas, separate lounge, and premium amenities.",
    description:
      "Perched on the top floor, the Panorama Executive Suite commands breathtaking 270-degree mountain and skyline vistas.",
    detailedDescription:
      "Perched on the top floor, the Panorama Executive Suite commands breathtaking 270-degree mountain and skyline vistas. Features a distinct living lounge, executive workstation, walk-in closet, and lavish marble bathroom with dual vanities.",
    pricePerNight: 4590,
    capacity: 3,
    sizeSqm: 65,
    beds: "1 King Bed + 1 Sofa Bed",
    viewType: "360° Mountain Skyline View",
    floorLevel: "5th Floor (Penthouse Level)",
    images: [
      "/images/rooms/room-4.avif",
      "/images/rooms/room-5.avif",
      "/images/rooms/room-6.avif",
      "/images/rooms/room-2.avif",
    ],
    amenities: [
      "High-Speed Free Wi-Fi",
      "Separate Living Lounge",
      "Walk-in Closet",
      "Executive Workstation",
      "Jacuzzi & Dual Vanities",
      "65\" OLED 4K Smart TV",
      "Bluetooth Sound System",
      "Nespresso & Premium Teas",
      "Complimentary Cocktail Hour",
      "24/7 Butler & Room Service",
    ],
    policies: [
      "Check-in: 02:00 PM | Check-out: 12:00 PM",
      "Free Cancellation up to 48 hours prior to check-in",
      "Non-smoking suite",
      "Airport shuttle service included",
    ],
    rating: 5.0,
    reviewsCount: 24,
    available: true,
  },
};

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 1,
    authorName: "Ananya Sharma",
    rating: 5,
    comment:
      "Absolutely breathtaking stay! The room view was divine, mattress super comfortable, and the Jacuzzi bath was pure luxury. Will definitely visit again!",
    createdAt: "2 weeks ago",
  },
  {
    id: 2,
    authorName: "Vikram Malhotra",
    rating: 5,
    comment:
      "Spotless clean, high speed Wi-Fi for work, delicious room service breakfast, and extremely helpful staff. Highly recommended!",
    createdAt: "1 month ago",
  },
  {
    id: 3,
    authorName: "Sophia Miller",
    rating: 4,
    comment:
      "Great room design and amenities. The morning garden view from the balcony was the highlight of our holiday.",
    createdAt: "1 month ago",
  },
];

export default function RoomDetailsPage() {
  const { slug } = useParams();


  const [room, setRoom] = useState<Room | null>(null);
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [related, setRelated] = useState<Room[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">("loading");

  // Gallery state
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const navigate = useNavigate(); const [showAuthModal, setShowAuthModal] = useState(false);


  // Bookmark / Favorite state
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = room?.id ? isInWishlist(room.id) : false;
  const [copiedShare, setCopiedShare] = useState(false);

  // New review submission state
  const [newReviewer, setNewReviewer] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewSubmittedMsg, setReviewSubmittedMsg] = useState("");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setActiveImgIndex(0);

    const matchFallback = (slugStr?: string): Room | null => {
      if (!slugStr) return null;
      const lower = slugStr.toLowerCase();
      if (FALLBACK_ROOMS_DB[lower]) return FALLBACK_ROOMS_DB[lower];

      // Generic fallback search by keyword
      if (lower.includes("garden")) return FALLBACK_ROOMS_DB["garden-room"];
      if (lower.includes("panorama") || lower.includes("exec")) return FALLBACK_ROOMS_DB["panorama-suite"];
      if (lower.includes("lake") || lower.includes("suite") || lower.includes("deluxe")) return FALLBACK_ROOMS_DB["lakeside-suite"];

      // Return a generated room for any arbitrary slug
      return {
        id: Number(slugStr) || Date.now(),
        name: slugStr.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: slugStr,
        type: "Deluxe",
        shortDescription: "Experience modern luxury with serene views, plush bedding, and refined hospitality.",
        description:
          "Designed with meticulous attention to detail, this space harmonizes comfort and luxury. Enjoy plush bed linen, a contemporary bathroom, high-speed Wi-Fi, and 24-hour dedicated room service.",
        pricePerNight: 2800,
        capacity: 2,
        sizeSqm: 40,
        beds: "1 King Size Bed",
        images: [
          "/images/rooms/room-1.avif",
          "/images/rooms/room-2.avif",
          "/images/rooms/room-3.avif",
          "/images/rooms/room-4.avif",
        ],
        amenities: [
          "High-Speed Free Wi-Fi",
          "Air Conditioning",
          "Smart TV",
          "Tea & Coffee Station",
          "Complimentary Breakfast",
          "Luxury Toiletries",
          "Daily Room Service",
        ],
        policies: [
          "Check-in: 02:00 PM | Check-out: 11:00 AM",
          "Free Cancellation up to 24 hours prior to check-in",
          "Non-smoking room",
        ],
        rating: 4.9,
        reviewsCount: 15,
        available: true,
      };
    };

    const loadFromLocalStorage = (): Room | null => {
      try {
        let stored = localStorage.getItem("hotel_rooms_data");
        if (!stored) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.includes("hotel_rooms_data")) {
              stored = localStorage.getItem(k);
              if (stored) break;
            }
          }
        }
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const found = parsed.find(
              (r) =>
                String(r.slug) === String(slug) ||
                String(r.id) === String(slug) ||
                String(r.number) === String(slug) ||
                String(r.roomNumber) === String(slug)
            );
            if (found) {
              return {
                id: found.id,
                name: found.name || (found.number ? `Room ${found.number}` : `${found.type || "Standard"} Room`),
                slug: found.slug || `room-${found.number || found.id}`,
                type: found.type || "Standard",
                shortDescription:
                  found.shortDescription ||
                  `Executive ${found.type || "room"} on ${found.floor || "1st Floor"} with elegant interior.`,
                description:
                  found.description ||
                  "Enjoy a luxurious stay featuring high-end furnishings, ambient lighting, soundproof walls, and peaceful views.",
                pricePerNight: Number(found.price || found.pricePerNight || 2500),
                capacity: Number(found.guests || found.capacity || 2),
                sizeSqm: found.sizeSqm || 35,
                beds: found.beds || "1 King Bed",
                images:
                  Array.isArray(found.images) && found.images.length
                    ? found.images
                    : found.image
                    ? [found.image]
                    : ["/images/rooms/room-1.avif", "/images/rooms/room-2.avif"],
                amenities:
                  found.amenities && found.amenities.length
                    ? found.amenities
                    : ["Free Wi-Fi", "Air Conditioning", "Smart TV", "Room Service", "Minibar"],
                policies:
                  found.policies && found.policies.length
                    ? found.policies
                    : ["Check-in: 02:00 PM | Check-out: 11:00 AM", "Free cancellation 24h before stay"],
                rating: found.rating || 4.9,
                reviewsCount: found.reviewsCount || 10,
                status: found.status || (found.booking ? "Occupied" : "Available"),
                available: found.status ? found.status.toLowerCase() === "available" : !found.booking,
                booking: found.booking || null,
              } as any;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load room from local storage:", err);
      }
      return null;
    };

    // Attempt API fetch first, fallback gracefully
    apiFetch(`/api/rooms/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (d && d.room) {
          setRoom(d.room);
          setReviews(d.reviews && d.reviews.length ? d.reviews : DEFAULT_REVIEWS);
          setRelated(d.related || []);
          setStatus("ok");
        } else {
          const localRoom = loadFromLocalStorage();
          const targetRoom = localRoom || matchFallback(slug);
          if (targetRoom) {
            setRoom(targetRoom);
            setStatus("ok");
          } else {
            setStatus("notfound");
          }
        }
      })
      .catch(() => {
        if (!active) return;
        const localRoom = loadFromLocalStorage();
        const targetRoom = localRoom || matchFallback(slug);
        if (targetRoom) {
          setRoom(targetRoom);
          setStatus("ok");
        } else {
          setStatus("notfound");
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // Load related rooms fallback
  useEffect(() => {
    if (room && (!related || related.length === 0)) {
      const fallbackRelated = Object.values(FALLBACK_ROOMS_DB).filter(
        (r) => r.slug !== room.slug
      );
      setRelated(fallbackRelated);
    }
  }, [room, related]);

  useTitle(room ? `${room.name} — Hotel Details` : "Room Details — Hotel");

  // Handle Share Room link copy

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (sessionStorage.getItem("user_logged_in") === "true") {
      navigate(`/booking?room=${room?.slug}`);
    } else {
      // show info toast instead of just opening
      import("../utils/toast").then(m => m.showError("Please login or create an account to book a room."));
      setShowAuthModal(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Handle submit review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewer.trim() || !newComment.trim()) return;

    const newRevObj: Review = {
      id: Date.now(),
      authorName: newReviewer.trim(),
      rating: newRating,
      comment: newComment.trim(),
      createdAt: "Just now",
    };

    setReviews((prev) => [newRevObj, ...prev]);
    setNewReviewer("");
    setNewComment("");
    setNewRating(5);
    setReviewSubmittedMsg("Thank you! Your review has been published.");
    setTimeout(() => setReviewSubmittedMsg(""), 4000);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cream font-jost dark:bg-slate-950">
        <PageHeader />
        <div className="mx-auto max-w-[1200px] px-4 py-28 text-center text-slate-500">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-base font-semibold">Loading room details…</p>
        </div>
      </div>
    );
  }

  if (status === "notfound" || !room) {
    return (
      <div className="min-h-screen bg-cream font-jost dark:bg-slate-950">
        <PageHeader />
        <div className="mx-auto max-w-[1200px] px-4 py-24 text-center">
          <h1 className="text-3xl font-extrabold text-navy dark:text-white">Room Not Found</h1>
          <p className="mt-2 text-slate-500">The room you are looking for may have been moved or updated.</p>
          <Link
            to="/rooms"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 hover:opacity-90"
          >
            <FiArrowLeft /> Back to All Rooms
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const imagesList = room.images && room.images.length ? room.images : ["/images/rooms/room-1.avif"];
  const currentImg = imagesList[activeImgIndex] || imagesList[0];
  const fallbackDetails = FALLBACK_ROOMS_DB[room.slug];
  const fullDesc = room.description || fallbackDetails?.detailedDescription || room.shortDescription;
  const viewType = (room as any).viewType || fallbackDetails?.viewType || "Scenic View";
  const floorLevel = (room as any).floorLevel || fallbackDetails?.floorLevel || "Executive Floor";

  return (
    <div className="min-h-screen bg-cream font-jost text-navy dark:bg-slate-950 dark:text-white">
      <PageHeader />

      <main className="mx-auto w-[92%] max-w-[1920px] pb-24 pt-6 sm:w-[95%]">
        {/* BREADCRUMB & HEADER TOP BAR */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-navy dark:hover:text-white">
              Home
            </Link>
            <FiChevronRight className="h-4 w-4" />
            <Link to="/rooms" className="hover:text-navy dark:hover:text-white">
              Rooms &amp; Suites
            </Link>
            <FiChevronRight className="h-4 w-4" />
            <span className="font-semibold text-navy dark:text-white">{room.name}</span>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              title="Share Room"
            >
              <FiShare2 className="h-3.5 w-3.5 text-brand" />
              {copiedShare ? "Link Copied!" : "Share"}
            </button>

            <button
              onClick={() => toggleWishlist(room)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                isFavorite
                  ? "border-rose-300 bg-rose-50 text-rose-600 dark:bg-rose-950/50"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              }`}
              title="Save to Favorites"
            >
              <FiHeart className={`h-3.5 w-3.5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
              {isFavorite ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* TITLE & BADGES BAR */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-brand/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                {room.type}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                <FiCheckCircle className="h-3.5 w-3.5" /> Instant Confirmation
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl dark:text-white">
              {room.name}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <FiMapPin className="h-4 w-4 text-brand" /> {floorLevel} · {viewType}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 rounded-2xl bg-amber-50 px-4 py-2 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-800/60">
              <FiStar className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-amber-900 dark:text-amber-200">
                {(room.rating || 4.9).toFixed(1)}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400">
                ({room.reviewsCount || reviews.length} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* HERO IMAGE GALLERY & LIGHTBOX TRIGGER */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
          <div
            className="group relative aspect-[16/9] max-h-[520px] w-full cursor-pointer overflow-hidden"
            onClick={() => setIsLightboxOpen(true)}
          >
            <img
              src={currentImg}
              alt={room.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
                Click to view full screen gallery ({activeImgIndex + 1}/{imagesList.length})
              </span>
              <button
                type="button"
                className="hidden rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-navy shadow backdrop-blur transition group-hover:block hover:bg-white"
              >
                Expand Photo
              </button>
            </div>
          </div>

          {/* Thumbnails row */}
          {imagesList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto border-t border-white/10 bg-slate-950/80 p-3 backdrop-blur">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition-all ${
                    idx === activeImgIndex ? "scale-105 ring-brand opacity-100" : "opacity-60 hover:opacity-100 ring-transparent"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MAIN CONTENT GRID (LEFT DETAILS + RIGHT STICKY BOOKING CARD) */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 xl:gap-12">
          {/* LEFT 2 COLUMNS: ROOM SPECS & DETAILS */}
          <div className="space-y-10 lg:col-span-7 xl:col-span-8">
            {/* KEY SPECS GRID CARD */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-navy dark:text-white">Room Highlights &amp; Specifications</h2>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <FiUsers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Occupancy</div>
                    <div className="text-sm font-bold text-navy dark:text-white">Up to {room.capacity} Guests</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <FiMaximize className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Room Area</div>
                    <div className="text-sm font-bold text-navy dark:text-white">{room.sizeSqm || 40} m² ({Math.round((room.sizeSqm || 40) * 10.764)} sq.ft)</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <FaBed className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Bedding</div>
                    <div className="text-sm font-bold text-navy dark:text-white">{room.beds || "1 King Bed"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <FiMapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">View</div>
                    <div className="text-sm font-bold text-navy dark:text-white">{viewType}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <FaBath className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Bathroom</div>
                    <div className="text-sm font-bold text-navy dark:text-white">Ensuite &amp; Rain Shower</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <FiWifi className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Internet</div>
                    <div className="text-sm font-bold text-navy dark:text-white">Free High-Speed Wi-Fi</div>
                  </div>
                </div>
              </div>
            </section>

            {/* ROOM DESCRIPTION */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-navy dark:text-white">About This Room</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {fullDesc}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Every detail is tailored to ensure absolute tranquility during your stay. From premium acoustic soundproofing to customized climate control, you will experience comfort at every touchpoint.
              </p>
            </section>

            {/* CATEGORIZED AMENITIES */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-navy dark:text-white">Room Amenities &amp; Services</h2>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {/* Category 1: Comfort & Sleep */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-navy dark:text-white">
                    <FaBed className="text-brand" /> Sleep &amp; Comfort
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Premium Pillowtop Mattress</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> 100% Egyptian Cotton Linens</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Dual-zone Climate Control / AC</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Blackout Drapes &amp; Curtains</li>
                  </ul>
                </div>

                {/* Category 2: Media & Tech */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-navy dark:text-white">
                    <FiTv className="text-brand" /> Entertainment &amp; Tech
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> 55" Smart 4K UHD TV</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Ultra-Fast 100 Mbps Wi-Fi</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Bluetooth Audio Soundbar</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Universal USB Charging Ports</li>
                  </ul>
                </div>

                {/* Category 3: Bathroom Luxury */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-navy dark:text-white">
                    <FaBath className="text-brand" /> Bathroom &amp; Spa
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Rainfall Overhead Shower</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Organic Botanical Toiletries</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Plush Robes &amp; Waffle Slippers</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> High-power Ionic Hairdryer</li>
                  </ul>
                </div>

                {/* Category 4: Food & Refreshments */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-navy dark:text-white">
                    <FiCoffee className="text-brand" /> Refreshments
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Nespresso Espresso Machine</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Fully Stocked Minibar</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> Complimentary Mineral Water</li>
                    <li className="flex items-center gap-2"><FiCheck className="text-brand shrink-0" /> 24/7 In-Room Dining Menu</li>
                  </ul>
                </div>
              </div>

              {/* Extra amenity tags */}
              {room.amenities && room.amenities.length > 0 && (
                <div className="mt-8 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Features</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {room.amenities.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <FiCheck className="h-3 w-3 text-brand" /> {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* HOUSE POLICIES */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-navy dark:text-white">Hotel Policies &amp; Terms</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <FiClock className="h-5 w-5 shrink-0 text-brand mt-0.5" />
                  <div>
                    <strong className="block text-navy dark:text-white">Check-in &amp; Check-out</strong>
                    Check-in starts at 02:00 PM. Check-out is until 11:00 AM. Early check-in available upon request.
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <FiShield className="h-5 w-5 shrink-0 text-brand mt-0.5" />
                  <div>
                    <strong className="block text-navy dark:text-white">Cancellation Policy</strong>
                    Free cancellation up to 48 hours prior to arrival. 100% refund guaranteed.
                  </div>
                </div>
              </div>

              {room.policies && room.policies.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {room.policies.map((pol, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {pol}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* GUEST REVIEWS & ADD REVIEW SECTION */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-navy dark:text-white">Guest Reviews &amp; Ratings</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Verified stays from recent hotel guests</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-navy dark:text-white">{(room.rating || 4.9).toFixed(1)}</span>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FiStar key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="mt-6 space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand">
                          {rev.authorName.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-navy dark:text-white">{rev.authorName}</span>
                          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Verified Guest</span>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <FiStar key={i} className="h-3.5 w-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      "{rev.comment}"
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400">{rev.createdAt || "Recent stay"}</div>
                  </div>
                ))}
              </div>

              {/* Write a Review Form */}
              <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
                <h3 className="text-sm font-bold text-navy dark:text-white">Write a Guest Review</h3>

                {reviewSubmittedMsg && (
                  <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {reviewSubmittedMsg}
                  </div>
                )}

                <form onSubmit={handleAddReview} className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={newReviewer}
                      onChange={(e) => setNewReviewer(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Rating:</span>
                      <select
                        value={newRating}
                        onChange={(e) => setNewRating(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                        <option value={3}>⭐⭐⭐ (3/5)</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Share your experience staying in this room..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-brand px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: STICKY BOOKING CARD */}
          <aside className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl lg:sticky lg:top-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-navy dark:text-white">
                    ₹{Number(room.pricePerNight).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-400"> / night</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Best Rate Guaranteed
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">Includes all taxes, fees &amp; complimentary breakfast</p>

              <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <FiCheck className="text-emerald-500 font-bold" /> Free Gourmet Breakfast Included
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <FiCheck className="text-emerald-500 font-bold" /> High-speed 100Mbps Wi-Fi
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <FiCheck className="text-emerald-500 font-bold" /> Free Cancellation up to 48 Hours
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <FiCheck className="text-emerald-500 font-bold" /> Free Onsite Parking &amp; Valet
                </div>
              </div>

              {/* BOOK NOW PRIMARY CTA */}
              <button onClick={handleBookNow} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-center text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/30 transition-all hover:scale-[1.02] hover:opacity-95"
              >
                <FiCalendar className="h-4 w-4" /> Book Room Now
              </button>

              {/* DIRECT INQUIRY BUTTONS */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href="https://wa.me/919876543210?text=Hi,%20I%20would%20like%20to%20enquire%20about%20booking%20the%20room"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  <FaWhatsapp className="h-4 w-4 text-emerald-600" /> WhatsApp
                </a>
                <a
                  href="tel:+919876543210"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <FiPhoneCall className="h-3.5 w-3.5 text-brand" /> Call Hotel
                </a>
              </div>

              <div className="mt-4 text-center text-[11px] text-slate-400">
                <FiLock className="inline mr-1" /> 256-bit SSL Encrypted Booking
              </div>
            </div>
          </aside>
        </div>

        {/* Reviews */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-navy dark:text-white">
            Guest reviews
          </h2>
          {reviews.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/60 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <p className="text-sm text-slate-500">
                No reviews yet — be the first to stay and share your experience.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {reviews.map((rv) => (
                <div
                  key={rv.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy dark:text-white">
                      {rv.authorName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-amber-500">
                      {Array.from({ length: rv.rating }).map((_, i) => (
                        <FiStar key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {rv.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
        {/* RELATED ROOMS SECTION */}
        {related && related.length > 0 && (
          <section className="mt-20 border-t border-slate-200 pt-12 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-navy dark:text-white">You May Also Like</h2>
            <p className="mt-1 text-sm text-slate-500">Explore other rooms and suites in our hotel collection</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((r) => (
                <RoomCard key={String(r.id)} room={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* MOBILE FLOATING BOOKING BAR (FIXED BOTTOM FOR RESPONSIVENESS) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur sm:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div>
          <span className="text-xl font-extrabold text-navy dark:text-white">
            ₹{Number(room.pricePerNight).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-slate-400"> / night</span>
        </div>

        <button onClick={handleBookNow} className="rounded-full bg-brand px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand/30 hover:opacity-90"
        >
          Book Now
        </button>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/40"
          >
            <FiX className="h-6 w-6" />
          </button>

          <img
            src={currentImg}
            alt={room.name}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs text-white">
            {activeImgIndex + 1} of {imagesList.length} — {room.name}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
