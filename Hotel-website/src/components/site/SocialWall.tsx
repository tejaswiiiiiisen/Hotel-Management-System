
import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { FaInstagram, FaFacebookF } from "react-icons/fa";

const posts = [
  { img: "/social_media/b.webp", network: "instagram" },
  { img: "/social_media/b.webp", network: "facebook" },
  { img: "/social_media/b.webp", network: "instagram" },
  { img: "/social_media/b.webp", network: "instagram" },
  { img: "/social_media/b.webp", network: "instagram" }
 
];

const platformIcon = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
};

export default function SocialWall() {
  const [filter, setFilter] = useState(null); // null = all

  const shown = filter ? posts.filter((p) => p.network === filter) : posts;

  const Tab = ({ id, icon: Icon, label }) => {
    const active = filter === id;
    return (
      <button
        type="button"
        onClick={() => setFilter(active ? null : id)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] transition-colors ${
          active
            ? "bg-brand text-white"
            : "text-[#6b7280] hover:text-navy"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  };

  return (
    <section className="bg-cream px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Heading + copy + link */}
        <div className="text-center">
          <h2 className="text-[clamp(28px,4.5vw,50px)] font-extrabold uppercase tracking-[0.02em] text-navy">
            Social media wall
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-[#6b7280]">
            From our regional breakfast buffet to peaceful moments by the pool or
            an aperitif on your private balcony — follow the{" "}
            <span className="font-semibold text-navy">stories</span> from our
            lakeside hotel on social media.
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            View social media wall
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Network filter */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <span className="text-[12px] uppercase tracking-[0.12em] text-[#9aa0ad]">
            Filter network
          </span>
          <Tab id="instagram" icon={FaInstagram} label="Instagram" />
          <Tab id="facebook" icon={FaFacebookF} label="Facebook" />
        </div>

        {/* Post grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((p, i) => {
            const Icon = platformIcon[p.network];
            return (
              <div
                key={p.img + i}
                className="group relative aspect-square overflow-hidden rounded-md"
              >
                <img
                  src={p.img}
                  alt="Social media post from the Hotel"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-navy">
                  <Icon className="h-3 w-3" />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
