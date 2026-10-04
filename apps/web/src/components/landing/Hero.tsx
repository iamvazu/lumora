'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, CalendarCheck, KeyRound, Radio, TrendingUp } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function Hero() {
  const { hero } = landingContent;

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      <div className="absolute top-20 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-36 right-10 w-[450px] h-[450px] bg-[#EC4899]/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-[#F59E0B]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
              {hero.eyebrow}
            </div>

            <h1 className="text-[clamp(2.75rem,5.5vw,4.75rem)] font-extrabold tracking-[-0.03em] text-[#F5F5F7] leading-[1.08]">
              {hero.titleLine1} <br />
              {hero.titleLine2}{' '}
              <span className="bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] bg-clip-text text-transparent">
                {hero.titleHighlight}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#A1A1AA] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/signup?role=creator"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] shadow-[0_0_30px_rgba(236,72,153,0.35)] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {hero.primaryCta}
              </Link>
              <Link
                href="/explore"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all flex items-center justify-center"
              >
                {hero.secondaryCta}
              </Link>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#A1A1AA]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
                <span>{hero.microTrust[0]?.label || 'ID-verified creators'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#EC4899]" />
                <span>{hero.microTrust[1]?.label || 'Payouts weekly'}</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F59E0B]" />
                <span>{hero.microTrust[2]?.label || '2FA on every creator account'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-[480px] lg:max-w-[520px] aspect-[4/5] rounded-[28px] p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.35)] overflow-visible">
              <div className="relative w-full h-full rounded-[27px] overflow-hidden bg-[#101015]">
                <Image
                  src={hero.image}
                  alt={hero.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="object-cover object-center"
                />
              </div>

              <div
                className="absolute -top-4 -left-4 sm:-left-6 p-3 sm:p-4 rounded-2xl bg-[#101015]/80 backdrop-blur-xl border border-white/15 shadow-xl flex items-center gap-3 animate-float"
                style={{ animationDuration: '6s' }}
              >
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {hero.floatingCards.subscriber.title}
                  </div>
                  <div className="text-[11px] text-[#A1A1AA]">
                    {hero.floatingCards.subscriber.subtitle}
                  </div>
                </div>
              </div>

              <div
                className="absolute top-1/2 -right-4 sm:-right-8 -translate-y-1/2 p-4 rounded-2xl bg-[#101015]/85 backdrop-blur-xl border border-white/15 shadow-2xl space-y-1.5 animate-float"
                style={{ animationDuration: '7s', animationDelay: '1s' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-medium text-[#A1A1AA]">
                    {hero.floatingCards.earnings.label}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" /> +24%
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {hero.floatingCards.earnings.amount}
                </div>
                <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] w-3/4 rounded-full" />
                </div>
                <div className="text-[10px] text-zinc-500 text-right">
                  {hero.floatingCards.earnings.caption}
                </div>
              </div>

              <div
                className="absolute -bottom-5 left-4 sm:left-8 p-3 sm:p-4 rounded-2xl bg-[#101015]/85 backdrop-blur-xl border border-white/15 shadow-xl flex items-center gap-3 animate-float"
                style={{ animationDuration: '6.5s', animationDelay: '2s' }}
              >
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold tracking-wider">
                  <Radio className="w-3 h-3 animate-pulse" />
                  {hero.floatingCards.live.status}
                </div>
                <div className="text-xs font-medium text-white">
                  {hero.floatingCards.live.details}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
