'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function FinalCta() {
  const { closingCta } = landingContent;

  const floatingThumbnails = [
    { src: '/landing/cat-music.webp', alt: 'Music Creator', rotate: '-6deg', top: '15%', left: '8%' },
    { src: '/landing/cat-art.webp', alt: 'Art Creator', rotate: '4deg', top: '55%', left: '12%' },
    { src: '/landing/cat-fitness.webp', alt: 'Fitness Creator', rotate: '-4deg', top: '20%', right: '10%' },
    { src: '/landing/cat-cosplay.webp', alt: 'Cosplay Creator', rotate: '6deg', top: '60%', right: '14%' },
  ];

  return (
    <section className="py-28 md:py-36 relative overflow-hidden bg-[#07070A] border-t border-white/5">
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
        <Image
          src={closingCta.bgImage}
          alt="Aurora Atmosphere"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="hidden xl:block absolute inset-0 pointer-events-none">
        {floatingThumbnails.map((thumb, idx) => (
          <div
            key={idx}
            className="absolute w-24 h-32 rounded-2xl overflow-hidden p-[1px] bg-gradient-to-b from-white/30 to-white/5 shadow-2xl animate-float"
            style={{
              top: thumb.top,
              left: thumb.left,
              right: thumb.right,
              transform: `rotate(${thumb.rotate})`,
              animationDuration: `${6 + idx}s`,
            }}
          >
            <div className="relative w-full h-full rounded-[15px] overflow-hidden bg-[#101015]">
              <Image src={thumb.src} alt={thumb.alt} fill sizes="96px" className="object-cover" />
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto px-5 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/10 backdrop-blur-md border border-white/15 text-pink-300">
          <Sparkles className="w-3.5 h-3.5" />
          Join The Future
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.03em] text-white leading-tight">
          {closingCta.title}
        </h2>

        <p className="text-lg sm:text-xl text-zinc-300 max-w-xl mx-auto leading-relaxed">
          {closingCta.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/signup?role=creator"
            className="w-full sm:w-auto px-9 py-4 rounded-2xl font-bold text-zinc-950 bg-white hover:bg-zinc-100 shadow-[0_0_35px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {closingCta.cta}
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors flex items-center justify-center"
          >
            {closingCta.exploreCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
