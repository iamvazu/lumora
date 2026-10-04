'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { landingContent } from '@/content/landing';
import { calculateEarnings } from '@/lib/calculator';

export function EarningsCalculator() {
  const { calculator } = landingContent;
  const [fans, setFans] = useState<number>(250);
  const [price, setPrice] = useState<number>(9.99);

  const earnings = calculateEarnings(fans, price);

  return (
    <section id="pricing" className="py-24 md:py-32 bg-[#07070A] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#8B5CF6]/15 via-[#EC4899]/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-[900px] mx-auto px-5 md:px-8">
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
            {calculator.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {calculator.title}
          </h2>
          <p className="text-base md:text-lg text-[#A1A1AA] max-w-xl mx-auto">
            {calculator.subtitle}
          </p>
        </div>

        <div className="p-8 sm:p-12 rounded-[28px] bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.25)] space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="fans-slider" className="text-sm font-semibold text-zinc-300">
                  {calculator.fansLabel}
                </label>
                <span className="text-xl font-black text-white px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                  {fans.toLocaleString()}
                </span>
              </div>
              <input
                id="fans-slider"
                type="range"
                min="10"
                max="5000"
                step="10"
                value={fans}
                onChange={(e) => setFans(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-[#EC4899]"
              />
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>10 fans</span>
                <span>5,000 fans</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="price-slider" className="text-sm font-semibold text-zinc-300">
                  {calculator.priceLabel}
                </label>
                <span className="text-xl font-black text-white px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                  ${price.toFixed(2)}
                </span>
              </div>
              <input
                id="price-slider"
                type="range"
                min="4.99"
                max="49.99"
                step="1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-[#8B5CF6]"
              />
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>$4.99 / mo</span>
                <span>$49.99 / mo</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-white/10 space-y-4">
            <div className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Estimated Creator Take-Home
            </div>
            <div className="text-5xl sm:text-7xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] bg-clip-text text-transparent">
                {earnings.monthlyTakeHomeFormatted}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-zinc-400">/ mo</span>
            </div>

            <div className="text-xs sm:text-sm font-medium text-zinc-400 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <span>Fans pay {earnings.grossFormatted}</span>
              <span>•</span>
              <span className="text-zinc-500">Lumora fee 20% ({earnings.lumoraFeeFormatted})</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">You keep 80%</span>
            </div>

            <p className="text-[11px] text-zinc-500 max-w-md mx-auto pt-2">
              {calculator.footnote}
            </p>

            <div className="pt-4">
              <Link
                href="/signup?role=creator"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] shadow-[0_0_25px_rgba(236,72,153,0.3)] hover:opacity-95 transition-all"
              >
                Claim your earnings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
