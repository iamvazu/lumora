'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function Pricing() {
  const { pricing } = landingContent;

  return (
    <section className="py-24 md:py-32 bg-[#07070A] relative overflow-hidden">
      <div className="max-w-[1000px] mx-auto px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
            {pricing.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {pricing.title}
          </h2>
          <p className="text-base md:text-lg text-[#A1A1AA]">{pricing.subtitle}</p>
        </div>

        <div className="p-8 sm:p-12 rounded-[28px] bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.25)] space-y-10">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-4xl sm:text-6xl font-black text-white">80%</span>
                <div className="text-xs font-semibold uppercase tracking-wider text-pink-400 mt-1">
                  {pricing.split.creatorLabel}
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-4xl font-bold text-zinc-500">20%</span>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mt-1">
                  {pricing.split.platformLabel}
                </div>
              </div>
            </div>

            <div className="h-5 sm:h-6 w-full rounded-full bg-white/10 overflow-hidden flex p-1">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] w-[80%] shadow-lg" />
              <div className="h-full rounded-full bg-zinc-800 w-[20%]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/10">
            {pricing.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm text-zinc-300 font-medium">{bullet}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/signup?role=creator"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] shadow-[0_0_30px_rgba(236,72,153,0.35)] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {pricing.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
