
import { useState } from "react";

// Interactive image gallery for the room details page: a large main image with
// a row of selectable thumbnails.
export default function RoomGallery({ images = [], alt = "" }) {
  const list = images.length ? images : ["/images/1.webp"];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <img
          src={list[active]}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {list.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === active
                  ? "ring-brand"
                  : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
