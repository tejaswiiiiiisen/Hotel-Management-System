import { FiArrowRight } from "react-icons/fi";

// Cream intro for the packages section — heading, copy and a details link.
export default function PackagesIntro() {
  return (
    <section className="bg-cream px-4 py-20 text-center sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-[clamp(28px,4.5vw,50px)] font-extrabold uppercase leading-[1.1] tracking-[0.02em] text-navy">
          Packages for
          <br />
          your perfect stay
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-[#6b7280]">
          Natural. Individual. Laid-back. Stylish. Book a{" "}
          <span className="font-semibold text-navy">package</span> at our{" "}
          <span className="font-semibold text-navy">lakeside hotel</span> to give
          your holiday that{" "}
          <span className="font-semibold text-navy">extra touch of exclusivity</span>.
        </p>
        <button
          type="button"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          View all packages
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
