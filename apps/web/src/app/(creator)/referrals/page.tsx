'use client';

import React, { useState } from 'react';
import { Button } from '@lumora/ui';
import {
  Share2,
  Copy,
  Check,
  DollarSign,
  Users,
  Sparkles,
  Award,
  ArrowUpRight,
} from 'lucide-react';

export default function CreatorReferralsPage() {
  const [copied, setCopied] = useState(false);

  const referralSummary = {
    referralCode: 'elena_valkyrie',
    referralUrl: 'https://lumora.app/signup?ref=elena_valkyrie',
    sharePercent: 5,
    activeReferralsCount: 4,
    totalCommissionCents: 124500, // $1,245.00
    referredCreators: [
      {
        id: 'r1',
        handle: 'chloe_noir',
        displayName: 'Chloe Noir',
        joinedAt: '3 months ago',
        expiresIn: '9 months remaining',
        lifetimeGmvCents: 1450000, // $14,500.00
        commissionEarnedCents: 72500, // $725.00 (5% of GMV)
        status: 'active',
      },
      {
        id: 'r2',
        handle: 'aria_cyber',
        displayName: 'Aria Takahashi',
        joinedAt: '2 months ago',
        expiresIn: '10 months remaining',
        lifetimeGmvCents: 840000, // $8,400.00
        commissionEarnedCents: 42000, // $420.00
        status: 'active',
      },
      {
        id: 'r3',
        handle: 'pixel_artisan',
        displayName: 'Neo Pixel',
        joinedAt: '1 month ago',
        expiresIn: '11 months remaining',
        lifetimeGmvCents: 200000, // $2,000.00
        commissionEarnedCents: 10000, // $100.00
        status: 'active',
      },
    ],
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralSummary.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Share2 className="w-7 h-7 text-purple-400" /> Creator Referral Program
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Earn 5% of gross earnings from every creator you invite to Lumora for 12 full months.
            </p>
          </div>
        </div>

        {/* Unique Link Card */}
        <div className="p-6 bg-gradient-to-r from-purple-950/50 via-zinc-900 to-zinc-900 border border-purple-500/30 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" /> 5% Commission Split • 12 Months
            </span>
            <h2 className="text-lg font-bold text-white">Your Personal Creator Invitation Link</h2>
            <p className="text-xs text-zinc-400">
              When a creator signs up with your link, Lumora automatically allocates 5% of their transaction volume directly to your creator balance.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto bg-zinc-950/80 border border-zinc-800 p-2 rounded-2xl">
            <input
              type="text"
              readOnly
              value={referralSummary.referralUrl}
              className="bg-transparent text-xs text-purple-300 font-mono px-3 py-1.5 focus:outline-none w-full md:w-80"
            />
            <Button
              variant="primary"
              onClick={handleCopy}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Referral Earnings */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Lifetime Referral Income</span>
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white font-mono">
                ${(referralSummary.totalCommissionCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" /> Automatically credited to balance
              </div>
            </div>
          </div>

          {/* Active Referrals */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Referred Creators</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white font-mono">
                {referralSummary.activeReferralsCount}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Generating 5% commission</p>
            </div>
          </div>

          {/* Commission Rate */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Commission Rate</span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 font-mono">
                5.0%
              </p>
              <p className="text-xs text-zinc-400 mt-1">For 12 months per creator</p>
            </div>
          </div>
        </div>

        {/* Referred Creators List */}
        <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Referred Creators Activity</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Performance and earnings per referred creator</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Status & Window</th>
                  <th className="py-3 px-4">Lifetime Volume (GMV)</th>
                  <th className="py-3 px-4 text-right">Your 5% Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {referralSummary.referredCreators.map((creator) => (
                  <tr key={creator.id} className="hover:bg-zinc-950/40 transition">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-xs">
                        {creator.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-200">{creator.displayName}</p>
                        <p className="text-[11px] text-zinc-500">@{creator.handle}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {creator.joinedAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {creator.expiresIn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      ${(creator.lifetimeGmvCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      +${(creator.commissionEarnedCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
