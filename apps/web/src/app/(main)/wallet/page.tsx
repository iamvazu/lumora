'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@lumora/ui';
import {
  Wallet as WalletIcon,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Sliders,
  CheckCircle2,
  Clock,
  TrendingUp,
  History,
} from 'lucide-react';

interface WalletTransaction {
  id: string;
  type: 'wallet_topup' | 'subscription' | 'ppv_post' | 'tip';
  description: string;
  amountCents: number;
  currency: string;
  date: string;
  status: 'succeeded' | 'pending' | 'failed';
}

export default function WalletPage() {
  const [balanceCents, setBalanceCents] = useState(4500); // $45.00
  const [spentTodayCents] = useState(1500); // $15.00
  const [spentThisMonthCents] = useState(6500); // $65.00
  const [dailyLimitCents, setDailyLimitCents] = useState(10000); // $100.00
  const [monthlyLimitCents, setMonthlyLimitCents] = useState(50000); // $500.00
  const [customTopup, setCustomTopup] = useState('');
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [selectedTopupAmount, setSelectedTopupAmount] = useState<number | null>(5000);
  const [isSavingLimits, setIsSavingLimits] = useState(false);
  const [limitsSavedToast, setLimitsSavedToast] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 'tx-1',
      type: 'wallet_topup',
      description: 'Wallet Top-Up via Card (CCBill)',
      amountCents: 5000,
      currency: 'USD',
      date: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      status: 'succeeded',
    },
    {
      id: 'tx-2',
      type: 'ppv_post',
      description: 'PPV Unlock: "Backstage Photoshoot (4K Set)" by @sierra_sky',
      amountCents: 1500,
      currency: 'USD',
      date: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      status: 'succeeded',
    },
    {
      id: 'tx-3',
      type: 'tip',
      description: 'Creator Tip to @maya_lux with note',
      amountCents: 1000,
      currency: 'USD',
      date: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      status: 'succeeded',
    },
    {
      id: 'tx-4',
      type: 'subscription',
      description: 'Monthly VIP Subscription to @elena_rose',
      amountCents: 2000,
      currency: 'USD',
      date: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
      status: 'succeeded',
    },
  ]);

  const topupPresets = [1000, 2500, 5000, 10000, 25000];

  const handleTopupSubmit = () => {
    const amount = selectedTopupAmount || (Number(customTopup) ? Math.round(Number(customTopup) * 100) : 0);
    if (amount <= 0) return;

    setBalanceCents((prev) => prev + amount);
    const newTx: WalletTransaction = {
      id: `tx-topup-${Date.now()}`,
      type: 'wallet_topup',
      description: 'Wallet Top-Up via Card (CCBill)',
      amountCents: amount,
      currency: 'USD',
      date: new Date().toISOString(),
      status: 'succeeded',
    };
    setTransactions([newTx, ...transactions]);
    setIsTopupModalOpen(false);
    setSelectedTopupAmount(5000);
    setCustomTopup('');
  };

  const handleSaveLimits = () => {
    setIsSavingLimits(true);
    setTimeout(() => {
      setIsSavingLimits(false);
      setLimitsSavedToast(true);
      setTimeout(() => setLimitsSavedToast(false), 3000);
    }, 400);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'topups') return tx.type === 'wallet_topup';
    if (activeFilter === 'spends') return tx.type !== 'wallet_topup';
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg text-white">
                <WalletIcon className="w-7 h-7" />
              </div>
              Fan Wallet & Balances
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Zero-friction 1-click unlocks, tipping, and responsible spending protection.
            </p>
          </div>

          <Button
            variant="primary"
            className="flex items-center gap-2 shadow-lg shadow-purple-900/30"
            onClick={() => setIsTopupModalOpen(true)}
          >
            <CreditCard className="w-4 h-4" />
            Top Up Balance
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main Balance Card */}
          <Card className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-purple-900/40 relative overflow-hidden rounded-2xl shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Available Balance
              </span>
              <Badge variant="purple">Instant Unlocks Ready</Badge>
            </div>
            <div className="text-4xl font-extrabold text-white tracking-tight mb-2">
              ${(balanceCents / 100).toFixed(2)}
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Backed by double-entry ledger invariant
            </p>
          </Card>

          {/* Today's Spend */}
          <Card className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Spent Today
              </span>
              <TrendingUp className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ${(spentTodayCents / 100).toFixed(2)}
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-pink-500 h-1.5 rounded-full"
                style={{
                  width: `${Math.min(100, (spentTodayCents / (dailyLimitCents || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              ${((dailyLimitCents - spentTodayCents) / 100).toFixed(2)} remaining under daily cap
            </p>
          </Card>

          {/* Monthly Spend */}
          <Card className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Spent This Month
              </span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ${(spentThisMonthCents / 100).toFixed(2)}
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-purple-500 h-1.5 rounded-full"
                style={{
                  width: `${Math.min(100, (spentThisMonthCents / (monthlyLimitCents || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              ${((monthlyLimitCents - spentThisMonthCents) / 100).toFixed(2)} remaining under monthly cap
            </p>
          </Card>
        </div>

        {/* Responsible Spending Protection Section */}
        <Card className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Responsible Spending Protection</h2>
                <p className="text-xs text-zinc-400">
                  Custom budget guardrails to protect against impulsive overspending.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveLimits}
              disabled={isSavingLimits}
            >
              {isSavingLimits ? 'Saving...' : 'Save Limits'}
            </Button>
          </div>

          {limitsSavedToast && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Spending limits updated successfully across your account.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Daily Limit Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-zinc-300">Daily Spending Cap</span>
                <span className="font-bold text-white">${(dailyLimitCents / 100).toFixed(0)}</span>
              </div>
              <input
                type="range"
                min={2000}
                max={50000}
                step={1000}
                value={dailyLimitCents}
                onChange={(e) => setDailyLimitCents(Number(e.target.value))}
                className="w-full accent-purple-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>$20 min</span>
                <span>$500 max</span>
              </div>
            </div>

            {/* Monthly Limit Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-zinc-300">Monthly Spending Cap</span>
                <span className="font-bold text-white">${(monthlyLimitCents / 100).toFixed(0)}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={200000}
                step={5000}
                value={monthlyLimitCents}
                onChange={(e) => setMonthlyLimitCents(Number(e.target.value))}
                className="w-full accent-purple-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>$50 min</span>
                <span>$2,000 max</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Transaction History
            </h2>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('topups')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeFilter === 'topups'
                    ? 'bg-purple-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Top-Ups
              </button>
              <button
                onClick={() => setActiveFilter('spends')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeFilter === 'spends'
                    ? 'bg-purple-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Purchases & Tips
              </button>
            </div>
          </div>

          <Card className="divide-y divide-zinc-800/60 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No transactions found for this filter.
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4.5 flex items-center justify-between hover:bg-zinc-900/40 transition">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'wallet_topup'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}
                    >
                      {tx.type === 'wallet_topup' ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{tx.description}</div>
                      <div className="text-xs text-zinc-500">
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        tx.type === 'wallet_topup' ? 'text-emerald-400' : 'text-zinc-100'
                      }`}
                    >
                      {tx.type === 'wallet_topup' ? '+' : '-'}${ (tx.amountCents / 100).toFixed(2) }
                    </div>
                    <Badge variant={tx.status === 'succeeded' ? 'success' : 'default'}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Top-Up Modal */}
        {isTopupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md">
              <Card className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Top Up Fan Wallet</h3>
                      <p className="text-xs text-zinc-400">Add funds for instant 1-click unlocks</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTopupModalOpen(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Select Amount</label>
                  <div className="grid grid-cols-3 gap-2">
                    {topupPresets.map((cents) => (
                      <button
                        key={cents}
                        type="button"
                        onClick={() => {
                          setSelectedTopupAmount(cents);
                          setCustomTopup('');
                        }}
                        className={`py-2.5 text-xs font-bold rounded-xl border transition ${
                          selectedTopupAmount === cents
                            ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        ${(cents / 100).toFixed(0)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Custom Amount ($USD)</label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={customTopup}
                    onChange={(e) => {
                      setCustomTopup(e.target.value);
                      setSelectedTopupAmount(null);
                    }}
                    placeholder="e.g. 75"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Processor Info */}
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Payment Processor:</span>
                    <span className="text-zinc-200 font-medium">CCBill High-Risk Gateway</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ledger Invariant:</span>
                    <span className="text-emerald-400 font-medium">Zero-Sum Balanced</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="w-1/2"
                    onClick={() => setIsTopupModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="w-1/2"
                    onClick={handleTopupSubmit}
                  >
                    Confirm & Charge
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
