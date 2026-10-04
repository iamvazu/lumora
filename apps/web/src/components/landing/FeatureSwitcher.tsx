'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CreditCard,
  MessageSquareLock,
  Radio,
  PackageOpen,
  HeartHandshake,
  FolderLock,
  Lock,
} from 'lucide-react';
import { landingContent } from '@/content/landing';

const iconList = [
  <CreditCard key="sub" className="w-5 h-5 text-[#8B5CF6]" />,
  <MessageSquareLock key="msg" className="w-5 h-5 text-[#EC4899]" />,
  <Radio key="live" className="w-5 h-5 text-rose-400" />,
  <PackageOpen key="bdl" className="w-5 h-5 text-[#F59E0B]" />,
  <HeartHandshake key="tip" className="w-5 h-5 text-emerald-400" />,
  <FolderLock key="vlt" className="w-5 h-5 text-cyan-400" />,
];

export function FeatureSwitcher() {
  const { featureSwitcher } = landingContent;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featureSwitcher.features.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featureSwitcher.features.length]);

  const activeFeature = featureSwitcher.features[activeIndex]!;

  return (
    <section id="features" className="py-24 md:py-32 bg-[#07070A] relative">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
            {featureSwitcher.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {featureSwitcher.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 flex flex-col gap-3">
            {featureSwitcher.features.map((feat, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={feat.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left p-5 rounded-2xl transition-all duration-300 border relative overflow-hidden group ${
                    isCurrent
                      ? 'bg-white/10 border-white/20 shadow-[0_10px_30px_rgba(139,92,246,0.15)]'
                      : 'bg-white/[0.02] hover:bg-white/5 border-white/5'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]" />
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isCurrent
                          ? 'bg-white/10 border-white/20'
                          : 'bg-white/5 border-white/5'
                      }`}
                    >
                      {iconList[idx]}
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                        {feat.name}
                      </div>
                      <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                        {feat.tagline}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7">
            <div className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-2xl">
              <div className="relative w-full h-full rounded-[27px] overflow-hidden bg-[#101015]">
                <Image
                  src={activeFeature.image}
                  alt={activeFeature.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover transition-opacity duration-300"
                />

                {activeFeature.overlayType === 'subscription' && (
                  <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-[#101015]/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-2.5 w-64">
                    <div className="text-xs font-bold text-white">Membership Plans</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10 font-semibold text-white">
                        <span>1 Month</span>
                        <span className="text-pink-400">$9.99</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-300">
                        <span>3 Months</span>
                        <span className="text-amber-300">-15% ($25.47)</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-300">
                        <span>6 Months</span>
                        <span className="text-purple-300">-25% ($44.95)</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature.overlayType === 'message' && (
                  <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-[#101015]/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-3 w-64">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Lock className="w-3.5 h-3.5 text-pink-400" />
                      Locked Exclusive Media
                    </div>
                    <div className="h-20 w-full rounded-xl bg-purple-900/30 border border-white/10 flex items-center justify-center backdrop-blur-md">
                      <span className="text-xs font-semibold text-pink-300 px-3 py-1.5 rounded-lg bg-black/50 border border-pink-500/30">
                        Unlock for $12.00
                      </span>
                    </div>
                  </div>
                )}

                {activeFeature.overlayType === 'live' && (
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[#101015]/90 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center justify-between">
                    <div className="space-y-1.5 w-2/3">
                      <div className="flex justify-between text-xs font-semibold text-white">
                        <span>Tip Goal: Acoustic Album Drop</span>
                        <span className="text-amber-400">68% ($340 / $500)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] w-[68%]" />
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-bounce">
                      +$20.00 Tip!
                    </div>
                  </div>
                )}

                {activeFeature.overlayType === 'bundle' && (
                  <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-[#101015]/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-2 w-64">
                    <div className="text-xs font-bold text-white">Summer Collection Pack</div>
                    <p className="text-[11px] text-zinc-400">24 High-Res Photo Sets & Video Vault</p>
                    <div className="flex justify-between items-center pt-1 border-t border-white/10">
                      <span className="text-sm font-black text-amber-400">$29.00</span>
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-white/10 text-white font-medium">
                        Instant Drop
                      </span>
                    </div>
                  </div>
                )}

                {activeFeature.overlayType === 'tips' && (
                  <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-[#101015]/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-2.5 w-60">
                    <div className="text-xs font-bold text-white">Send Creator Tip</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="py-2 text-center rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 cursor-pointer">
                        $5
                      </div>
                      <div className="py-2 text-center rounded-lg bg-white/5 border border-pink-500/40 text-xs font-bold text-pink-300 cursor-pointer">
                        $10
                      </div>
                      <div className="py-2 text-center rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 cursor-pointer">
                        $25
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature.overlayType === 'vault' && (
                  <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-[#101015]/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-2 w-64">
                    <div className="text-xs font-bold text-white">Asset Organization</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        #4K-Sets (48)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        #Audio-Stems (12)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        #BTS-Master (18)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
