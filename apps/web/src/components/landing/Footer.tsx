'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldAlert, Globe } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function Footer() {
  const { footer } = landingContent;

  return (
    <footer className="bg-[#050508] border-t border-white/10 pt-20 pb-12 text-zinc-400 text-sm">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                {footer.brand}
              </span>
            </Link>

            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              {footer.tagline}
            </p>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Creator Dispatch
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footer.columns.map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-xs">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-amber-300 font-bold border border-white/5 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5" /> 18+ ONLY
            </span>
            <span>{footer.complianceNote}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Globe className="w-3.5 h-3.5" /> English (US)
            </span>
            <Link href="/compliance/2257" className="hover:text-zinc-300 underline underline-offset-2">
              18 U.S.C. §2257 Statement
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
