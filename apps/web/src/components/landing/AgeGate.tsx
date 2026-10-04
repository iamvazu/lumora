'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldAlert } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function AgeGate() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check for cookie
    const hasConfirmed = document.cookie
      .split('; ')
      .find((row) => row.startsWith('lumora_age_ok='));

    if (!hasConfirmed) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    // Set 30-day cookie
    const maxAge = 30 * 24 * 60 * 60;
    document.cookie = `lumora_age_ok=1; path=/; max-age=${maxAge}; SameSite=Lax`;
    setIsOpen(false);
  };

  const handleLeave = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in"
    >
      <div className="relative w-full max-w-md p-8 text-center rounded-3xl bg-[#101015] border border-white/10 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.5)]">
        {/* Subtle glowing aura */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center space-y-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 shadow-lg shadow-purple-500/25">
            <Sparkles className="w-7 h-7 text-white" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              18+ Adults Only
            </div>
            <h2 id="age-gate-title" className="text-2xl font-bold tracking-tight text-white">
              {landingContent.ageGate.title}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {landingContent.ageGate.description}
            </p>
          </div>

          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] shadow-[0_0_25px_rgba(236,72,153,0.35)] hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {landingContent.ageGate.confirmButton}
            </button>
            <button
              onClick={handleLeave}
              className="w-full py-3 px-6 rounded-xl font-medium text-sm text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
            >
              {landingContent.ageGate.leaveButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
