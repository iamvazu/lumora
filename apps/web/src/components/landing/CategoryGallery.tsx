'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { landingContent } from '@/content/landing';

export function CategoryGallery() {
  const { categories } = landingContent;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-24 md:py-32 bg-[#07070A] relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
            {categories.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {categories.title}
          </h2>
        </div>

        {/* Desktop Expandable Accordion (Hidden on mobile) */}
        <div className="hidden md:flex w-full h-[480px] gap-3">
          {categories.items.map((cat) => {
            const isHovered = hoveredId === cat.id;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative h-full rounded-[24px] overflow-hidden p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 transition-all duration-500 ease-out cursor-pointer ${
                  isHovered ? 'flex-[2.4]' : 'flex-1'
                }`}
              >
                <div className="relative w-full h-full rounded-[23px] overflow-hidden bg-[#101015]">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1240px) 25vw, 300px"
                    className="object-cover"
                  />
                  {/* Subtle darkening on bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Bottom glass label */}
                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 space-y-1">
                    <div className="text-sm font-bold text-white whitespace-nowrap">
                      {cat.name}
                    </div>
                    {isHovered && (
                      <p className="text-xs text-zinc-300 leading-tight animate-fade-in line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Snap-Scroll Carousel (Visible on mobile only) */}
        <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-2 -mx-5 px-5 no-scrollbar">
          {categories.items.map((cat) => (
            <div
              key={cat.id}
              className="flex-shrink-0 w-[75%] aspect-[2/3] snap-center rounded-[24px] overflow-hidden p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10"
            >
              <div className="relative w-full h-full rounded-[23px] overflow-hidden bg-[#101015]">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="75vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/15">
                  <div className="text-sm font-bold text-white">{cat.name}</div>
                  <p className="text-xs text-zinc-300 mt-0.5 line-clamp-2">{cat.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
