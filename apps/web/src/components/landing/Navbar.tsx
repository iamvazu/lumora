'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const sectionIds = landingContent.navbar.links.map((l) => l.href.replace('#', ''));
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const obs = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry && entry.isIntersecting) {
              setActiveSection(id);
            }
          },
          { rootMargin: '-30% 0px -60% 0px' }
        );
        obs.observe(el);
        observers.push(obs);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-40 px-4 md:px-6 flex justify-center pointer-events-none">
        <nav
          className={`pointer-events-auto w-full max-w-[1240px] h-16 rounded-2xl flex items-center justify-between px-5 md:px-6 transition-all duration-300 border ${
            scrolled
              ? 'bg-[#0B0B10]/85 backdrop-blur-xl border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]'
              : 'bg-white/5 backdrop-blur-lg border-white/10'
          }`}
          aria-label="Main Navigation"
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              {landingContent.navbar.brand}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {landingContent.navbar.links.map((link) => {
              const id = link.href.replace('#', '');
              const isActive = activeSection === id;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    isActive ? 'text-white font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signin"
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              {landingContent.navbar.loginCta}
            </Link>
            <Link
              href="/signup?role=creator"
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {landingContent.navbar.signupCta}
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/signup?role=creator"
              className="px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]"
            >
              {landingContent.navbar.signupCta}
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-zinc-300 hover:text-white bg-white/5 border border-white/5"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[#07070A]/95 backdrop-blur-2xl flex flex-col p-6 animate-fade-in">
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white">
                {landingContent.navbar.brand}
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-4 py-8 flex-1">
            {landingContent.navbar.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-bold text-zinc-300 hover:text-white py-2"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
            <Link
              href="/signup?role=creator"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3.5 text-center font-semibold text-white rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]"
            >
              {landingContent.navbar.signupCta}
            </Link>
            <Link
              href="/signin"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3 text-center font-medium text-zinc-400 hover:text-white bg-white/5 rounded-xl border border-white/10"
            >
              {landingContent.navbar.loginCta}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
