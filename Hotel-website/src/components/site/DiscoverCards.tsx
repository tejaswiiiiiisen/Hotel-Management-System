
const cards = [
  {
    title: "What does the Hotel\nstand for?",
    img: "/footer/a.webp",
  },
  {
    title: "Relax Time",
    img: "/footer/b.webp",
  },
  {
    title: "Sustainability",
    img: "/footer/c.webp",
  },
];

export default function DiscoverCards() {
  return (
    <div className="flex w-full snap-x snap-mandatory overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-3 md:gap-10 md:overflow-x-visible md:pb-0 scrollbar-hide">
      {cards.map((card) => (
        <div
          key={card.title}
          className="relative h-[180px] w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl md:w-auto md:rounded-none"
        >
          <img
            src={card.img}
            alt={card.title}

            className="absolute inset-0 h-full w-full object-cover duration-500 hover:scale-105"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/35" />

          {/* Title */}
          <h3
            className="absolute bottom-5 left-5 whitespace-pre-line text-4xl font-light text-white"
            style={{ fontFamily: "var(--font-italiana)" }}
          >
            {card.title}
          </h3>
        </div>
      ))}
    </div>
  );
}