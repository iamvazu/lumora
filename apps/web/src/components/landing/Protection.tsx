'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  Globe,
  Shield,
  FileText,
  UserCheck,
  Headphones,
} from 'lucide-react';
import { landingContent } from '@/content/landing';

const iconMap: Record<string, React.ReactNode> = {
  lock: <Lock className="w-5 h-5 text-purple-600" />,
  globe: <Globe className="w-5 h-5 text-pink-600" />,
  shield: <Shield className="w-5 h-5 text-amber-500" />,
  'file-text': <FileText className="w-5 h-5 text-indigo-600" />,
  'user-check': <UserCheck className="w-5 h-5 text-emerald-600" />,
  headphones: <Headphones className="w-5 h-5 text-blue-600" />,
};

export function Protection() {
  const { protection } = landingContent;

  return (
    <section id="safety" className="py-24 md:py-32 bg-[#F7F5FB] text-[#0B0B12] relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[420px] aspect-square rounded-[28px] overflow-hidden p-[1px] bg-gradient-to-b from-purple-300 via-pink-200 to-amber-200 shadow-2xl">
              <div className="relative w-full h-full rounded-[27px] overflow-hidden bg-[#101015]">
                <Image
                  src={protection.image}
                  alt={protection.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-purple-100 text-purple-700 border border-purple-200">
                {protection.eyebrow}
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#0B0B12] leading-tight">
                {protection.title}
              </h2>
              <p className="text-base text-zinc-600 leading-relaxed max-w-xl">
                {protection.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {protection.items.map((item) => (
                <div
                  key={item.title}
                  className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm space-y-2 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                    {iconMap[item.icon] || <Shield className="w-5 h-5 text-purple-600" />}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/safety"
                className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors"
              >
                {protection.cta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
