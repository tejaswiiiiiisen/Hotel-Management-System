import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

const discover = [
  {
    title: "Restaurant Ankkuri",
    img: "/images/dinning/dinning-2.avif",
    body: "What's on your plate? A seasonal and imaginative fusion of forest, meadow, and lake. Our menu follows the rhythm of nature.",
  },
  {
    title: "Poolside Moments",
    img: "/images/hotel/spa-1.jpg",
    body: "Drop anchor and relax. Swim a few laps in the heated outdoor infinity pool. Enjoy a sauna session, a yoga class, or a soothing massage.",
  },
];

// One discover item — circular photo beside a title, blurb and details link.
function DiscoverItem({ title, img, body }) {
  return (
    <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6">
      <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-full sm:h-60 sm:w-60">
        <img
          src={img}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="max-w-[240px]">
        <h3 className="text-[15px] font-bold uppercase tracking-[0.12em] text-navy">
          {title}
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-[#6b7280]">{body}</p>
        <Link
          to="/services"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-navy/25 px-5 py-2 text-[13px] font-semibold text-navy transition-colors hover:border-transparent hover:bg-brand hover:text-white"
        >
          <FiArrowRight className="h-3.5 w-3.5" />
          View details
        </Link>
      </div>
    </div>
  );
}

export default function HomeIntro() {
  return (
    <section className="bg-cream px-4 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        {/* Intro heading + copy */}
        <div className="text-center">
          <h2 className="text-[clamp(30px,4.5vw,52px)] font-extrabold uppercase leading-[1.1] tracking-[0.02em] text-navy">
            Our hotel,
            <br />
            your happiness
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed text-[#6b7280]">
            Imagine that carefree moment: sitting by the lake, sipping a glass of
            wine as the golden sunlight melts into the water. A balmy breeze
            rustles the reeds; a great egret takes flight into the sunset. Peace.
            Nature. Lightness. <span className="font-semibold text-navy">At our hotel</span>,
            life is just that little bit more beautiful. It&rsquo;s a place to
            unwind, recharge, and rediscover the quiet joy of simply being.
          </p>
        </div>

        {/* Discover circles with prev / next */}
        <div className="mt-16 flex items-center justify-center gap-4 sm:gap-8">
          <button
            type="button"
            aria-label="Previous"
            className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d9d9e3] text-navy transition-colors hover:border-transparent hover:bg-brand hover:text-white sm:grid"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-10">
            {discover.map((d) => (
              <DiscoverItem key={d.title} {...d} />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next"
            className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d9d9e3] text-navy transition-colors hover:border-transparent hover:bg-brand hover:text-white sm:grid"
          >
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Rooms and suites */}
        <div className="mt-28 text-center">
          <h2 className="text-[clamp(30px,4.5vw,52px)] font-extrabold uppercase tracking-[0.02em] text-navy">
            Rooms and suites
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed text-[#6b7280]">
            Spaces that give your mind room to breathe. In the{" "}
            <span className="font-semibold text-navy">rooms and suites</span> of
            our hotel by the lake, you&rsquo;ll settle into a sense of{" "}
            <span className="font-semibold text-navy">lightness</span> — calm
            interiors, soft light, and views that slow the day right down.
          </p>
          <Link
            to="/rooms"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            View rooms
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
