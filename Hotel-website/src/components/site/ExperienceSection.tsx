import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

const testimonials = [
  {
    quote:
      "A truly restful escape. The lakeside views, the spa, and the quiet attention to detail made every moment feel considered. We left calmer than we arrived.",
    name: "Robert Meyer",
    role: "Returning Guest",
    img: 14,
  },
  {
    quote:
      "The best stay we've had in years. Warm, effortless service from arrival to checkout, beautiful rooms, and food worth travelling for. We're already planning our next visit.",
    name: "Emma Klein",
    role: "Honeymoon Guest",
    img: 5,
  },
];

// One quote card — italic quote, gradient-ringed avatar, name + role.
function QuoteCard({ quote, name, role, img, className = "" }) {
  return (
    <div
      className={`rounded-[28px] bg-white p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.07)] ${className}`}
    >
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

export default function ExperienceSection() {
  return (
    <div className="bg-cream">
      {/* ---------- Testimonials ---------- */}
      <section className="px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-start">
            Guest Stories
          </p>
          <h1 className="mt-3 max-w-md text-[clamp(34px,5vw,52px)] font-extrabold leading-[1.05] text-navy">
            Words from our guests
          </h1>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
            <QuoteCard {...testimonials[0]} className="md:mt-16" />
            <QuoteCard {...testimonials[1]} />
          </div>

          {/* Carousel arrows (decorative) */}
          <div className="mt-10 flex justify-center gap-4">
            <button
              type="button"
              aria-label="Previous"
              className="grid h-11 w-11 place-items-center rounded-full border border-[#e2e2ea] bg-white text-navy transition-colors hover:bg-brand hover:text-white hover:border-transparent"
            >
              <FiArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next"
              className="grid h-11 w-11 place-items-center rounded-full border border-[#e2e2ea] bg-white text-navy transition-colors hover:bg-brand hover:text-white hover:border-transparent"
            >
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ---------- Booking CTA ---------- */}
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-start">
              Plan your stay
            </p>
            <h2 className="mt-4 max-w-xl text-[clamp(30px,4.5vw,46px)] font-extrabold leading-[1.08] text-navy">
              Book a stay and let us take care of every detail
            </h2>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Book a Stay
                <FiArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-navy/25 px-7 py-3.5 text-sm font-semibold text-navy transition-colors hover:border-brand-start hover:text-brand-start"
              >
                Get In Touch
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Photo */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px]">
            <img
              src="/images/3.webp"
              alt="Guests enjoying their stay at the Hotel"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
