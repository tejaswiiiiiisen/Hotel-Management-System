
// Leadership team — avatars served from pravatar (allowed in next.config).
const team = [
  { name: "Leslie Alexander", role: "General Manager", img: 5 },
  { name: "Guy Hawkins", role: "Guest Relations", img: 12 },
  { name: "Marvin McKinney", role: "Executive Chef", img: 13 },
  { name: "Annette Black", role: "Head of Reservations", img: 9 },
];

// A single team member card — gradient-ringed avatar + name + role.
function TeamCard({ name, role, img }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#ececf3] bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_8px_26px_rgba(102,126,234,0.15)]">
      <span className="shrink-0 rounded-full bg-brand p-[2px]">
        <img
          src={`https://i.pravatar.cc/120?img=${img}`}
          alt={name}
          width={52}
          height={52}
          className="h-[52px] w-[52px] rounded-full border-2 border-white object-cover"
        />
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-bold text-navy">{name}</div>
        <div className="text-[13px] text-[#8a90a0]">{role}</div>
      </div>
    </div>
  );
}

// Small orbiting avatar on the radial graphic.
function OrbAvatar({ img, className }) {
  return (
    <span
      className={`absolute grid place-items-center rounded-full bg-white p-[2px] shadow-md ${className}`}
    >
      <img
        src={`https://i.pravatar.cc/80?img=${img}`}
        alt=""
        width={40}
        height={40}
        className="rounded-full object-cover"
      />
    </span>
  );
}

// Central-orb wave mark echoing the site's ripple motif.
function WaveMark({ className }) {
  return (
    <svg viewBox="0 0 40 24" fill="none" className={className}>
      <path
        d="M2 12c4-9 8 9 12 0s8-9 12 0 8 9 12 0"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AboutSection() {
  return (
    <section className="bg-cream px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl rounded-[32px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8">
        {/* Hero band — soft brand-tinted gradient */}
        <div className="rounded-[24px] bg-gradient-to-br from-brand-start/12 via-white to-brand-end/12 px-6 py-16 text-center sm:py-20">
          <h1 className="text-[clamp(40px,6vw,64px)] font-extrabold tracking-tight text-navy">
            About us
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[#6b7280]">
            A lakeside retreat built around genuine hospitality.
            <br />
            We craft calm, considered stays for every guest.
          </p>
        </div>

        {/* Team + orbit */}
        <div className="mt-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Left: heading, copy and cards */}
          <div>
            <h2 className="text-[28px] font-extrabold text-navy">Team</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#6b7280]">
              We&rsquo;ve lived your travels. We&rsquo;ve spent years perfecting
              the art of the stay. We think you deserve better hospitality.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {team.map((m) => (
                <TeamCard key={m.name} {...m} />
              ))}
            </div>
          </div>

          {/* Right: radial orbit graphic */}
          <div className="relative mx-auto aspect-square w-full max-w-[440px]">
            {/* Concentric dashed rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-navy/15" />
            <div className="absolute inset-[15%] rounded-full border border-dashed border-navy/15" />
            <div className="absolute inset-[30%] rounded-full border border-dashed border-navy/15" />

            {/* Central brand orb */}
            <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-white shadow-lg">
              <WaveMark className="h-6 w-10" />
            </span>

            {/* Orbiting avatars */}
            <OrbAvatar img={1} className="left-1/2 top-[6%] -translate-x-1/2" />
            <OrbAvatar img={8} className="left-[16%] top-[34%]" />
            <OrbAvatar img={11} className="right-[14%] top-[46%]" />
            <OrbAvatar img={14} className="left-[26%] bottom-[16%]" />

            {/* Accent dots — brand palette + a few soft accents */}
            <span className="absolute right-[8%] top-[16%] h-2.5 w-2.5 rounded-full bg-brand-start" />
            <span className="absolute left-[6%] top-[52%] h-2 w-2 rounded-full bg-brand-end" />
            <span className="absolute right-[4%] top-[56%] h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="absolute left-[30%] top-[20%] h-2 w-2 rounded-full bg-amber-400" />
            <span className="absolute bottom-[8%] left-[46%] h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="absolute bottom-[24%] right-[24%] h-2 w-2 rounded-full bg-brand-start" />
          </div>
        </div>
      </div>
    </section>
  );
}
