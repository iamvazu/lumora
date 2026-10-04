'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function ProfilePreview() {
  const { profilePreview } = landingContent;

  return (
    <section id="creators" className="py-24 md:py-32 bg-[#07070A] relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
              {profilePreview.eyebrow}
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {profilePreview.title}
            </h2>

            <p className="text-base md:text-lg text-[#A1A1AA] leading-relaxed">
              {profilePreview.description}
            </p>

            <div className="pt-2">
              <Link
                href="/signup?role=creator"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] shadow-[0_0_30px_rgba(236,72,153,0.35)] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {profilePreview.cta}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col items-center lg:items-end">
            <div className="relative w-full max-w-[460px] aspect-[4/5] rounded-[28px] p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-2xl">
              <div className="relative w-full h-full rounded-[27px] overflow-hidden bg-[#101015]">
                <Image
                  src={profilePreview.image}
                  alt={profilePreview.card.displayName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 460px"
                  className="object-cover object-center"
                />

                <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-80 p-5 rounded-2xl bg-[#101015]/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-purple-500/40">
                      <Image
                        src={profilePreview.card.avatar}
                        alt={profilePreview.card.displayName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                        {profilePreview.card.displayName}
                        <CheckCircle2 className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                      </div>
                      <div className="text-xs text-zinc-400">{profilePreview.card.handle}</div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {profilePreview.card.bio}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10 text-center">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {profilePreview.card.stats.posts}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase font-medium">Posts</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {profilePreview.card.stats.fans}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase font-medium">Fans</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {profilePreview.card.stats.likes}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase font-medium">Likes</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-90 transition-opacity">
                      {profilePreview.card.buttons.subscribe}
                    </button>
                    <button className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                      {profilePreview.card.buttons.follow}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-500 pt-3 pr-2">{profilePreview.caption}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
