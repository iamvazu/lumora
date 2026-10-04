'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function TestimonialSlot() {
  return null;
}

export function PersonaCarousel() {
  const { personas } = landingContent;
  const [currentIdx, setCurrentIdx] = useState(0);

  const prev = () => {
    setCurrentIdx((curr) => (curr === 0 ? personas.items.length - 1 : curr - 1));
  };

  const next = () => {
    setCurrentIdx((curr) => (curr === personas.items.length - 1 ? 0 : curr + 1));
  };

  return (
    <section className="py-24 md:py-32 bg-[#07070A] relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
              {personas.eyebrow}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {personas.title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Indicator dots */}
            <div className="flex items-center gap-1.5">
              {personas.items.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIdx ? 'w-6 bg-pink-500' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Previous persona"
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                aria-label="Next persona"
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.items.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[3/4] rounded-[24px] overflow-hidden p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-xl group"
            >
              <div className="relative w-full h-full rounded-[23px] overflow-hidden bg-[#101015]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-[#07070A]/50 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 space-y-2">
                  <div className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.role}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="text-xs text-zinc-400">{item.handle}</div>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed border-t border-white/10 pt-2 line-clamp-3">
                    {item.sells}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <TestimonialSlot />
      </div>
    </section>
  );
}
