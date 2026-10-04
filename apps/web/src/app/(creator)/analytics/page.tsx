'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  UserPlus,
  Sparkles,
  Radio,
  MessageSquare,
  Image,
  Award,
  ArrowUpRight,
} from 'lucide-react';

export default function CreatorAnalyticsPage() {
  const [period, setPeriod] = useState<'30d' | '90d' | '1y'>('30d');

  const summary = {
    totalGrossCents: 4850000, // $48,500.00
    netEarningsCents: 3880000, // $38,800.00 (80%)
    platformFeeCents: 970000,  // $9,700.00 (20%)
    activeSubscribers: 1240,
    newSubscribersThisMonth: 185,
    churnRatePercent: 4.2,
    averageTipCents: 2450, // $24.50
  };

  const revenueBreakdown = [
    { label: 'Subscriptions', cents: 2450000, percent: 50.5, icon: Users, color: 'from-purple-500 to-indigo-500' },
    { label: 'PPV Posts & Drops', cents: 1120000, percent: 23.1, icon: Image, color: 'from-pink-500 to-rose-500' },
    { label: 'Direct Messages & PPV', cents: 620000, percent: 12.8, icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
    { label: 'Live Stream Tickets & Gifts', cents: 450000, percent: 9.3, icon: Radio, color: 'from-amber-500 to-orange-500' },
    { label: 'Direct Profile Tips', cents: 210000, percent: 4.3, icon: Sparkles, color: 'from-emerald-500 to-teal-500' },
  ];

  const topFans = [
    {
      id: 'f1',
      handle: 'marcus_v',
      displayName: 'Marcus Vance',
      totalSpentCents: 485000, // $4,850.00
      subscriptionMonths: 8,
      lastActive: '2 hours ago',
      badge: 'VIP Diamond',
    },
    {
      id: 'f2',
      handle: 'crypto_dave',
      displayName: 'Dave K.',
      totalSpentCents: 320000, // $3,200.00
      subscriptionMonths: 6,
      lastActive: 'Yesterday',
      badge: 'Platinum',
    },
    {
      id: 'f3',
      handle: 'alex_99',
      displayName: 'Alex Smith',
      totalSpentCents: 240000, // $2,400.00
      subscriptionMonths: 5,
      lastActive: '3 days ago',
      badge: 'Gold',
    },
    {
      id: 'f4',
      handle: 'sarah_m',
      displayName: 'Sarah Miller',
      totalSpentCents: 185000, // $1,850.00
      subscriptionMonths: 4,
      lastActive: 'Today',
      badge: 'Gold',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <TrendingUp className="w-8 h-8 text-purple-400" /> Creator Business Analytics
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Real-time earnings aggregation, subscriber retention, and revenue streams breakdown
            </p>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
            {(['30d', '90d', '1y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === p
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p === '30d' ? 'Last 30 Days' : p === '90d' ? 'Last Quarter' : 'Past Year'}
              </button>
            ))}
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Revenue */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gross Volume (GMV)</span>
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white font-mono">
                ${(summary.totalGrossCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs previous period
              </div>
            </div>
          </div>

          {/* Net Creator Take */}
          <div className="p-5 bg-gradient-to-br from-purple-950/40 via-zinc-900/80 to-zinc-900 border border-purple-500/30 rounded-2xl flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-purple-300">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Creator Earnings (80%)</span>
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 font-mono">
                ${(summary.netEarningsCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Zero processing fees deducted
              </p>
            </div>
          </div>

          {/* Active Subscribers */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Subscribers</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white font-mono">
                {summary.activeSubscribers.toLocaleString()}
              </p>
              <div className="flex items-center gap-3 text-xs mt-1 text-zinc-400">
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <UserPlus className="w-3 h-3" /> +{summary.newSubscribersThisMonth} new
                </span>
                <span className="text-zinc-500">|</span>
                <span>Churn {summary.churnRatePercent}%</span>
              </div>
            </div>
          </div>

          {/* Average Tip */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Average Tip / Gift</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white font-mono">
                ${(summary.averageTipCents / 100).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Across chats & live streams</p>
            </div>
          </div>
        </div>

        {/* Revenue Source Breakdown */}
        <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Revenue Sources Breakdown</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Distribution of fan spend across Lumora monetization tools</p>
            </div>
            <span className="text-xs text-zinc-400 font-mono">100% Zero-Sum Ledger Audited</span>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden flex p-0.5 gap-1">
            {revenueBreakdown.map((item, idx) => (
              <div
                key={idx}
                className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                style={{ width: `${item.percent}%` }}
                title={`${item.label}: ${item.percent}%`}
              />
            ))}
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {revenueBreakdown.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-tr ${item.color} text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{item.label}</p>
                      <p className="text-[11px] text-zinc-500">{item.percent}% of GMV</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-bold text-zinc-100">
                    ${(item.cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Fan Spenders Leaderboard */}
        <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Top Fan Spenders Leaderboard
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Your most dedicated supporters and highest lifetime contributors</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Rank & Supporter</th>
                  <th className="py-3 px-4">Loyalty Tier</th>
                  <th className="py-3 px-4">Subscription Tenure</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {topFans.map((fan, idx) => (
                  <tr key={fan.id} className="hover:bg-zinc-950/40 transition">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <span className="font-mono font-bold text-zinc-400 w-4">#{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-xs">
                        {fan.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-200">{fan.displayName}</p>
                        <p className="text-[11px] text-zinc-500">@{fan.handle}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {fan.badge}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {fan.subscriptionMonths} consecutive months
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {fan.lastActive}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ${(fan.totalSpentCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
