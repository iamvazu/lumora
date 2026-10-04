'use client';

import React from 'react';
import Image from 'next/image';
import { landingContent } from '@/content/landing';

export function HowItWorks() {
  const { howItWorks } = landingContent;

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#07070A] relative">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
            {howItWorks.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {howItWorks.title}
          </h2>
        </div>

        {/* 3 Steps Container */}
        <div className="relative">
          {/* Connecting gradient line (hidden on mobile, visible on lg) */}
          <div className="hidden lg:block absolute top-[110px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] -z-0 opacity-40" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
            {howItWorks.steps.map((step) => (
              <div
                key={step.step}
                className="flex flex-col items-center text-center space-y-5 group"
              >
                {/* Step Image Frame */}
                <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-lg group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="relative w-full h-full rounded-[23px] overflow-hidden bg-[#101015]">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Step Number Badge */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-purple-500/30">
                  {step.step}
                </div>

                {/* Step Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
