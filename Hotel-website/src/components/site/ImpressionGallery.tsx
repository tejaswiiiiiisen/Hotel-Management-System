
import { useRef, useEffect } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

const STEP = 380;
const INTERVAL = 3000;

const images = [
  "/images/rooms/room-5.avif",
  "/images/dinning/dinning-3.avif",
  "/images/hotel/hotel-3.avif",
  "/images/rooms/room-6.avif",
  "/images/dinning/dinning-4.avif",
  "/images/hotel/hotel-4.avif",
  "/images/hotel/7.jpg",
];

export default function ImpressionGallery() {
  const scroller = useRef(null);
  const paused = useRef(false);

  const scrollBy = (dir) => {
    if (scroller.current) {
      scroller.current.scrollBy({ left: dir * STEP, behavior: "smooth" });
    }
  };

  // Auto-advance the strip; loop back to the start at the end. Pauses on hover.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const id = setInterval(() => {
      if (paused.current) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: STEP, behavior: "smooth" });
      }
    }, INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="overflow-hidden bg-navy py-14">
      <div className="relative">
        {/* Oversized title above the strip */}
        <h2 className="select-none whitespace-nowrap text-center text-[clamp(56px,11vw,150px)] font-extrabold uppercase leading-none tracking-[0.12em] text-white">
          Impression
        </h2>

        {/* Horizontal image strip, sitting cleanly below the title */}
        <div
          ref={scroller}
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
          className="mt-8 flex gap-3 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              className="relative h-[260px] w-[85vw] max-w-[340px] shrink-0 overflow-hidden rounded-sm sm:h-[300px] sm:w-[380px] sm:max-w-none"
            >
              <img
                src={src}
                alt="Impression of the Hotel"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="mx-auto mt-8 flex max-w-6xl items-center justify-between px-4">
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Previous impressions"
              onClick={() => scrollBy(-1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white hover:text-navy"
            >
              <FiArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next impressions"
              onClick={() => scrollBy(1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white hover:text-navy"
            >
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>

          <span className="cursor-pointer text-[13px] font-bold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-80">
            View all impressions
          </span>
        </div>
      </div>
    </section>
  );
}
