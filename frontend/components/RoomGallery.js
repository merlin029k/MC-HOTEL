'use client';

import { useState } from 'react';

// Full-size photo gallery for the room/booking detail page: large image
// with a clickable thumbnail strip.
export default function RoomGallery({ photos, alt }) {
  const [active, setActive] = useState(0);
  const images = photos && photos.length > 0 ? photos : [];

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-brand-50 text-sm text-brand-300 sm:h-80">
        No photos yet
      </div>
    );
  }

  return (
    <div>
      <div className="h-64 overflow-hidden rounded-lg bg-slate-100 sm:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={alt} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                i === active ? 'border-gold-400' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
