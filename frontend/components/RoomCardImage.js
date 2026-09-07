'use client';

import { useState } from 'react';

// Compact photo carousel for a room card: main image + dot controls.
// No external carousel lib — just cycling the active index.
export default function RoomCardImage({ photos, alt }) {
  const [active, setActive] = useState(0);
  const images = photos && photos.length > 0 ? photos : [];

  if (images.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-t-lg bg-brand-50 text-sm text-brand-300">
        No photo yet
      </div>
    );
  }

  return (
    <div className="group relative h-48 overflow-hidden rounded-t-lg bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[active]}
        alt={alt}
        className="h-full w-full object-cover transition-opacity duration-300"
        loading="lazy"
      />
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                setActive(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
