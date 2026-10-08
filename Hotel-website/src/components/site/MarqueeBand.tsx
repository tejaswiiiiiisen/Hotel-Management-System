// Navy band with rows of large text that scroll horizontally forever.
const rows = [
  { text: "Peace and quiet for adults only", dur: "34s", dir: "normal" },
  { text: "Relax and unwind  ·  Local cuisine", dur: "30s", dir: "reverse" },
  { text: "Nature. Culture. Experiences.  ·  Sustainable tourism", dur: "26s", dir: "normal" },
];

function Row({ text, dur, dir }) {
  const copies = Array.from({ length: 6 });
  const Track = ({ hidden = false }: any) => (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 animate-marquee items-center gap-16 pr-16"
      style={{ animationDuration: dur, animationDirection: dir }}
    >
      {copies.map((_, i) => (
        <span
          key={i}
          className="whitespace-nowrap text-[clamp(15px,2.2vw,30px)] font-extrabold uppercase tracking-[0.05em] text-white/90"
        >
          {text}
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex overflow-hidden">
      <Track />
      <Track hidden />
    </div>
  );
}

export default function MarqueeBand() {
  return (
    <section className="space-y-4 overflow-hidden bg-navy py-16">
      {rows.map((r) => (
        <Row key={r.text} {...r} />
      ))}
    </section>
  );
}
