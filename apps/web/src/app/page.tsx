import React from 'react';
import type { Metadata } from 'next';
import {
  AgeGate,
  Navbar,
  Hero,
  TrustMarquee,
  FeatureSwitcher,
  DashboardPreview,
  ProfilePreview,
  EarningsCalculator,
  HowItWorks,
  LiveShowcase,
  CategoryGallery,
  PersonaCarousel,
  Protection,
  Pricing,
  Faq,
  FinalCta,
  Footer,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'Lumora — The Creator-Owned 18+ Platform',
  description:
    'Monetize memberships, paid private messages, live streams, and high-fidelity video vaults. Keep 80% of earnings with guaranteed weekly payouts.',
  openGraph: {
    title: 'Lumora — Your Fans. Your Rules. Your Income.',
    description:
      'The modern creator-owned platform with subscriptions, paid DMs, and live streaming with an 80% creator payout.',
    type: 'website',
    url: 'https://lumora.app',
    siteName: 'Lumora',
  },
};

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lumora',
    url: 'https://lumora.app',
    logo: 'https://lumora.app/landing/hero-creator.webp',
    description: 'The creator-owned 18+ subscription and livestream platform.',
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Age Gate Overlay (Client component) */}
      <AgeGate />

      <div className="flex flex-col min-h-screen bg-[#07070A] text-[#F5F5F7] selection:bg-pink-500/30 selection:text-pink-200">
        {/* Sticky Glass Navbar */}
        <Navbar />

        {/* 17 Structured Sections */}
        <main className="flex-1">
          {/* 2.3 Split Hero */}
          <Hero />

          {/* 2.4 Trust Strip Marquee */}
          <TrustMarquee />

          {/* 2.5 Feature Switcher */}
          <FeatureSwitcher />

          {/* 2.6 Creator Dashboard Preview (Light Band) */}
          <DashboardPreview />

          {/* 2.7 Own Your Audience Profile Preview */}
          <ProfilePreview />

          {/* 2.8 Interactive Earnings Calculator */}
          <EarningsCalculator />

          {/* 2.9 How It Works (3 Steps) */}
          <HowItWorks />

          {/* 2.10 Full-Bleed Live Showcase */}
          <LiveShowcase />

          {/* 2.11 Categories Gallery */}
          <CategoryGallery />

          {/* 2.12 Creator Personas */}
          <PersonaCarousel />

          {/* 2.13 Protection & Safety (Light Band) */}
          <Protection />

          {/* 2.14 Transparent Pricing */}
          <Pricing />

          {/* 2.15 FAQ Accordion */}
          <Faq />

          {/* 2.16 Closing CTA */}
          <FinalCta />
        </main>

        {/* 2.17 Rich Footer */}
        <Footer />
      </div>
    </>
  );
}
