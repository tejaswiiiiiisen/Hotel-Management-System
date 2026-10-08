
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

// The four things we do, each with three photos. Images are reused from the
// shared /public/images set the rest of the site already ships.
const SERVICES = [
  {
    title: "Rooms & Suites",
    copy: "Restful rooms that give your mind space to breathe — lake-facing suites, soft linens and quiet corners, each opening onto calm.",
    tags: ["Lake views", "Suites", "Daily housekeeping"],
    images: [
      "/images/rooms/room-1.avif",
      "/images/rooms/room-2.avif",
      "/images/rooms/room-3.avif",
    ],
  },
  {
    title: "Dining & Bar",
    copy: "Seasonal menus built around local produce, a gourmet breakfast worth waking up for, and a lakeside bar for slow evenings.",
    tags: ["Gourmet breakfast", "Seasonal menu", "Lakeside bar"],
    images: [
      "/images/dinning/dinning-1.avif",
      "/images/dinning/dinning-2.avif",
      "/images/dinning/dinning-3.avif",
    ],
  },
  {
    title: "Spa & Wellness",
    copy: "Sauna, treatments and unhurried mornings by the water. A place to unwind, reset and leave lighter than you arrived.",
    tags: ["Sauna", "Treatments", "Pool"],
    images: [
      "/images/hotel/spa.jpg",
      "/images/hotel/spa-1.jpg",
      "/images/hotel/hotel-1.avif",
    ],
  },
  {
    title: "Events & Banquets",
    copy: "Weddings, conferences and private celebrations by Lake Neusiedl — considered spaces and a team that handles every detail.",
    tags: ["Weddings", "Conferences", "Private dining"],
    images: [
      "/images/hotel/hotel-2.avif",
      "/images/hotel/hotel-3.avif",
      "/images/hotel/hotel-4.avif",
    ],
  },
];

// The remaining photos, shown together as a gallery strip so nothing goes unused.
const GALLERY = [
  "/images/rooms/room-4.avif",
  "/images/dinning/dinning-4.avif",
  "/images/hotel/hotel-5.avif",
  "/images/rooms/room-5.avif",
  "/images/hotel/3.webp",
  "/images/dinning/6.webp",
  "/images/rooms/room-6.avif",
  "/images/hotel/7.jpg",
  "/images/rooms/5.webp",
];

const REVIEWS = [
  {
    quote:
      "Every service felt considered — from the spa to the dinner menu. We left calmer than we arrived and are already planning our return.",
    name: "Robert Meyer",
    role: "Returning Guest",
    img: 14,
  },
  {
    quote:
      "We held our wedding here and the team handled every detail. Warm, effortless and beautiful from the first call to the last dance.",
    name: "Emma Klein",
    role: "Wedding Guest",
    img: 5,
  },
  {
    quote:
      "The rooms, the food, the quiet attention — the best stay we've had in years. Genuine hospitality in every corner of the hotel.",
    name: "Jerry Wyatt",
    role: "Honeymoon Guest",
    img: 33,
  },
];

const FAQS = [
  {
    q: "How do I make a reservation?",
    a: "Browse our rooms, pick your dates and book online in a couple of minutes — or reach out to our team and we'll arrange everything for you.",
  },
  {
    q: "What time is check-in and check-out?",
    a: "Check-in is from 3:00 PM and check-out is by 11:00 AM. Early check-in and late check-out can be arranged on request, subject to availability.",
  },
  {
    q: "Is breakfast included in the room rate?",
    a: "Yes — every stay includes our gourmet breakfast, and all quoted rates are inclusive of taxes with no hidden booking fees.",
  },
  {
    q: "Do you offer spa treatments and events?",
    a: "We do. Our spa, dining and events teams can tailor treatments, private dinners, weddings and corporate gatherings around your stay.",
  },
  {
    q: "Are pets allowed?",
    a: "Well-behaved pets are welcome on request. Let us know when you book so we can prepare the room and share our house rules.",
  },
];

// Small uppercase eyebrow used above each section heading.
function Eyebrow({ children }) {
  return (
    <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-start">
      {children}
    </p>
  );
}

function ReviewCard({ quote, name, role, img }) {
  return (
    <div className="rounded-[28px] bg-white p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.07)]">
      <p className="text-[14px] italic leading-relaxed text-[#5b6472]">
        &ldquo; {quote} &rdquo;
      </p>
      <span className="mx-auto mt-7 block w-fit rounded-full bg-brand p-[2px]">
        <img
          src={`https://i.pravatar.cc/120?img=${img}`}
          alt={name}
          width={56}
          height={56}
          className="h-14 w-14 rounded-full border-2 border-white object-cover"
        />
      </span>
      <div className="mt-4 text-[15px] font-bold text-navy">{name}</div>
      <div className="text-[13px] text-[#8a90a0]">{role}</div>
    </div>
  );
}

export default function ServicesContent() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="bg-cream">
      {/* ---------- Hero ---------- */}
      <section className="px-4 pt-6 pb-16 text-center sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display font-light leading-[0.95] text-navy text-[clamp(56px,12vw,150px)]">
            Services
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[clamp(17px,2.2vw,22px)] leading-relaxed text-navy/80">
            [ We bring together everything that makes a lakeside stay effortless —
            restful rooms, considered dining, quiet wellness and events worth
            remembering — all built around genuine hospitality. ]
          </p>
        </div>
      </section>

      {/* ---------- Service blocks ---------- */}
      <section className="px-4 pb-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {SERVICES.map((s, i) => (
            <div key={s.title} className="border-t border-navy/10 py-10 sm:py-14">
              <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
                {/* Text */}
                <div>
                  <span className="text-sm font-bold text-brand-start">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 text-[clamp(24px,3vw,32px)] font-bold text-navy">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#5b6472]">
                    {s.copy}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-steel/10 px-3 py-1 text-xs font-semibold text-steel"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {s.images.map((src, k) => (
                    <div
                      key={src + k}
                      className="relative aspect-[3/4] overflow-hidden rounded-2xl"
                    >
                      <img
                        src={src}
                        alt={`${s.title} ${k + 1}`}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Impressions gallery ---------- */}
      <section className="px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Eyebrow>A closer look</Eyebrow>
            <h2 className="mt-3 text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.05] text-navy">
              Impressions
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {GALLERY.map((src) => (
              <div
                key={src}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl"
              >
                <img
                  src={src}
                  alt="A glimpse of the hotel"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Clients Reviews ---------- */}
      <section className="px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow>Guest Stories</Eyebrow>
          <h2 className="mt-3 text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.05] text-navy">
            Clients Reviews
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <ReviewCard key={r.name} {...r} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
          <div>
            <Eyebrow>Good to know</Eyebrow>
            <h2 className="mt-3 text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.05] text-navy">
              FAQ
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#5b6472]">
              Everything you might want to ask before you arrive. Still unsure?{" "}
              <Link to="/contact" className="font-semibold text-steel hover:underline">
                Get in touch
              </Link>
              .
            </p>
          </div>

          <div>
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="border-b border-navy/10">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-[clamp(16px,2vw,19px)] font-semibold text-navy">
                      {f.q}
                    </span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-steel/10 text-steel">
                      {open ? (
                        <FiMinus className="h-4 w-4" />
                      ) : (
                        <FiPlus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  {open && (
                    <p className="max-w-2xl pb-6 text-sm leading-relaxed text-[#5b6472]">
                      {f.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="px-4 pb-20 sm:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-navy px-8 py-16 text-center sm:px-16 sm:py-20">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/60">
            Ready when you are
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.08] text-white">
            Have a stay in mind?
          </h2>
          <a
            href="mailto:hello@hotel.com"
            className="mt-6 inline-flex items-center gap-2 text-[clamp(20px,3vw,32px)] font-semibold text-white hover:opacity-90"
          >
            hello@hotel.com
            <FiArrowUpRight className="h-6 w-6" />
          </a>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Book a Stay
              <FiArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Contact Us
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
