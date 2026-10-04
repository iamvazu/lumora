'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@lumora/ui';
import { Sparkles, ShieldCheck, DollarSign, Radio, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Lumora
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="gradient" size="sm">
                Join Lumora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36">
          {/* Ambient Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/20 via-pink-600/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="container mx-auto px-4 text-center max-w-4xl space-y-8">
            <Badge variant="purple" className="px-3.5 py-1 text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Next-Generation 18+ Creator Economy
            </Badge>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              The Spotlight Belongs to{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Independent Creators
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Monetize memberships, paid private messages, live streams, and high-fidelity video vaults. 
              Keep 80% of earnings with guaranteed weekly payouts and compliant adult acquiring.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto px-8 gap-2">
                  Start Creating <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/signin" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                  Explore Creators
                </Button>
              </Link>
            </div>

            {/* Platform Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 border-t border-zinc-900/80">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold text-white">80%</div>
                <div className="text-xs text-zinc-500 uppercase font-semibold">Creator Revenue</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">&lt; 48 hrs</div>
                <div className="text-xs text-zinc-500 uppercase font-semibold">Onboarding to Earning</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold text-pink-400">100%</div>
                <div className="text-xs text-zinc-500 uppercase font-semibold">Pre-Screened & Compliant</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">1-Click</div>
                <div className="text-xs text-zinc-500 uppercase font-semibold">Fan Wallet Checkout</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-zinc-900/30 border-y border-zinc-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Built for Growth & Protection</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">Every tool you need to build a direct subscriber business with total control.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card glow className="space-y-4 p-8 border-purple-500/20">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Flexible Monetization</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Set tiered subscription prices, offer multi-month bundle discounts, send mass pay-per-view DMs, and receive tips in real-time.
                </p>
              </Card>

              <Card glow className="space-y-4 p-8 border-pink-500/20">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Ultra-Low Latency Live</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Broadcast directly from your browser or OBS via RTMP/WHIP. Set tip goals, receive live on-screen notifications, and lock ticketed streams.
                </p>
              </Card>

              <Card glow className="space-y-4 p-8 border-amber-500/20">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">2257 & Trust & Safety</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Automated model releases, co-performer verification links, automated hash matching against known CSAM, and client forensic watermarking.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-10">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">Lumora Platform</span>
            <span>· 18+ Verified Platform</span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-zinc-300">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
            <Link href="/compliance" className="hover:text-zinc-300">18 U.S.C. §2257</Link>
            <Link href="/dmca" className="hover:text-zinc-300">DMCA Takedown</Link>
          </div>
          <div>© 2026 Lumora. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
