'use client';

import React from 'react';
import {
  Dumbbell,
  Music,
  Palette,
  Sparkles,
  Compass,
  GraduationCap,
  Theater,
  UtensilsCrossed,
  Gamepad2,
  HeartPulse,
  Smile,
  Camera,
} from 'lucide-react';
import { landingContent } from '@/content/landing';

const iconMap: Record<string, React.ReactNode> = {
  Fitness: <Dumbbell className="w-4 h-4 text-[#EC4899]" />,
  Music: <Music className="w-4 h-4 text-[#8B5CF6]" />,
  Art: <Palette className="w-4 h-4 text-[#F59E0B]" />,
  Fashion: <Sparkles className="w-4 h-4 text-[#EC4899]" />,
  Travel: <Compass className="w-4 h-4 text-emerald-400" />,
  Coaching: <GraduationCap className="w-4 h-4 text-[#8B5CF6]" />,
  Cosplay: <Theater className="w-4 h-4 text-purple-400" />,
  Cooking: <UtensilsCrossed className="w-4 h-4 text-[#F59E0B]" />,
  Gaming: <Gamepad2 className="w-4 h-4 text-cyan-400" />,
  Wellness: <HeartPulse className="w-4 h-4 text-rose-400" />,
  Comedy: <Smile className="w-4 h-4 text-amber-300" />,
  Photography: <Camera className="w-4 h-4 text-blue-400" />,
};

export function TrustMarquee() {
  const categories = landingContent.trustStrip;
  const list = [...categories, ...categories, ...categories];

  return (
    <section className="py-6 border-y border-white/5 bg-[#0B0B10]/50 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#07070A] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#07070A] to-transparent z-10 pointer-events-none" />

      <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
        {list.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors text-sm font-medium text-zinc-300 select-none cursor-default"
          >
            {iconMap[item] || <Sparkles className="w-4 h-4 text-purple-400" />}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
