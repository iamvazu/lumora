'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { landingContent } from '@/content/landing';

export function Faq() {
  const { faq } = landingContent;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((curr) => (curr === idx ? null : idx));
  };

  return (
    <section className="py-24 md:py-32 bg-[#07070A] relative border-t border-white/5">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-white/5 border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
              {faq.eyebrow}
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {faq.title}
            </h2>

            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Have a question not answered here? Our 24/7 creator support team is always available to help.
            </p>

            <div>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-sm font-semibold text-pink-400 hover:text-pink-300 transition-colors"
              >
                {faq.helpCta}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-3">
            {faq.items.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors hover:border-white/20"
                >
                  <button
                    onClick={() => toggle(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="text-base font-bold text-white pr-4">{item.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-pink-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${idx}`}
                      className="px-6 pb-6 pt-1 text-sm text-[#A1A1AA] leading-relaxed border-t border-white/5 animate-fade-in"
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
