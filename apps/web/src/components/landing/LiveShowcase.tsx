'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Radio, Users, Sparkles, Send } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function LiveShowcase() {
  const { liveShowcase } = landingContent;

  return (
    <section id="live" className="py-24 md:py-32 bg-[#07070A] relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="relative w-full aspect-[16/9] min-h-[480px] md:min-h-[600px] rounded-[28px] overflow-hidden p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-2xl">
          <div className="relative w-full h-full rounded-[27px] overflow-hidden bg-[#0A0A0F]">
            <Image
              src={liveShowcase.image}
              alt={liveShowcase.title}
              fill
              sizes="(max-width: 1240px) 100vw, 1240px"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-[#07070A]/70 to-transparent lg:bg-gradient-to-r lg:from-[#07070A]/95 lg:via-[#07070A]/60 lg:to-transparent" />

            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-500/40 text-rose-400 text-xs font-extrabold tracking-wider">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 text-purple-400" /> 2,410 viewers
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-bounce">
                <Sparkles className="w-3.5 h-3.5" /> Recent Tip: @sam_k sent $25!
              </div>
            </div>

            <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end lg:grid lg:grid-cols-12 gap-8 items-end z-20">
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/10 backdrop-blur-md border border-white/15 text-pink-300">
                  {liveShowcase.eyebrow}
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {liveShowcase.title}
                </h2>

                <p className="text-sm md:text-base text-zinc-300 max-w-lg leading-relaxed">
                  {liveShowcase.description}
                </p>

                <div className="p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 max-w-md space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-white">
                    <span>Stream Tip Goal: New Lighting Rig</span>
                    <span className="text-amber-400">$840 / $1,000 (84%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] w-[84%]" />
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/signup?role=creator"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
                  >
                    {liveShowcase.cta}
                  </Link>
                </div>
              </div>

              <div className="hidden lg:flex lg:col-span-5 flex-col justify-end">
                <div className="w-full max-w-sm rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 p-4 space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Chat (Demo)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto text-xs pr-1">
                    {liveShowcase.mockChat.map((msg, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="font-bold text-pink-400 text-[11px]">{msg.user}</span>
                        <span className="text-zinc-200">{msg.message}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <div className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-500">
                      Send message to chat...
                    </div>
                    <button className="p-1.5 rounded-lg bg-pink-600 text-white" aria-label="Send message">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
