
import { useState, useEffect } from "react";

// Background photos that auto cross-fade behind the hero wordmark.
const slides = [
  "/images/hotel/hotel-1.avif",
  "/images/rooms/room-1.avif",
  "/images/hotel/hotel-2.avif",
  "/images/dinning/dinning-1.avif",
  "/images/hotel/spa.jpg",
];

const INTERVAL = 5000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      INTERVAL
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0">
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt="A stay at the Hotel"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1200ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
