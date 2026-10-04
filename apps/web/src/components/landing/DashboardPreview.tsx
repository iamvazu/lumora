'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Clock,
  ArrowUpRight,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { landingContent } from '@/content/landing';

export function DashboardPreview() {
  const { dashboardPreview } = landingContent;
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <section className="py-24 md:py-32 bg-[#F7F5FB] text-[#0B0B12] relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-purple-100 text-purple-700 border border-purple-200">
              {dashboardPreview.eyebrow}
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#0B0B12] leading-[1.15]">
              {dashboardPreview.title}
            </h2>

            <p className="text-base md:text-lg text-zinc-600 leading-relaxed">
              {dashboardPreview.description}
            </p>

            <div className="space-y-4 pt-2">
              {dashboardPreview.capabilities.map((cap) => (
                <div key={cap.title} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B0B12]">{cap.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href="/signup?role=creator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#0B0B12] hover:bg-zinc-800 transition-colors shadow-lg"
              >
                {dashboardPreview.cta} <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div
            className="lg:col-span-7 perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="w-full rounded-3xl p-6 sm:p-8 bg-white border border-zinc-200/80 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.15)] transition-transform duration-200 ease-out"
              style={{
                transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              }}
            >
              <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/20">
                    <Image
                      src={dashboardPreview.avatar}
                      alt={dashboardPreview.mock.creatorName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-base font-bold text-zinc-900">
                      {dashboardPreview.mock.creatorName}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {dashboardPreview.mock.handle} · Verified Creator
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Payouts Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                  <div className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                    <span>Subscribers</span>
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-zinc-900">
                    {dashboardPreview.mock.subscribersCount}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium">+18 this week</div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                  <div className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                    <span>Messages</span>
                    <BarChart3 className="w-3.5 h-3.5 text-pink-600" />
                  </div>
                  <div className="text-xl font-bold text-zinc-900">
                    {dashboardPreview.mock.messagesCount}
                  </div>
                  <div className="text-[11px] text-zinc-500">Avg. 15m response</div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                  <div className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                    <span>Next Live</span>
                    <Radio className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-sm font-bold text-zinc-900 truncate">
                    {dashboardPreview.mock.upcomingLive}
                  </div>
                  <div className="text-[11px] text-amber-600 font-medium">142 RSVPs</div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Recent Activity
                </div>
                <div className="space-y-2">
                  {dashboardPreview.mock.recentActivity.map((act, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 border border-zinc-100 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="font-medium text-zinc-800">{act.text}</span>
                      </div>
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {act.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
