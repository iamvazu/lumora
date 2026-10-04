'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@lumora/ui';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  CreditCard,
  Building2,
  FileText,
  Download,
  ShieldCheck,
  History,
} from 'lucide-react';
import type { PayoutMethodDto, PayoutDto, CreatorStatementDto } from '@lumora/contracts';

export default function PayoutsPage() {
  const [pendingCents] = useState(125000); // $1,250.00
  const [availableCents, setAvailableCents] = useState(480000); // $4,800.00
  const [holdingDays] = useState(3); // Mature creator
  const [isMature] = useState(true);

  const [payoutMethods] = useState<PayoutMethodDto[]>([
    {
      id: 'pm-1',
      creatorId: 'creator-current',
      provider: 'payoneer',
      maskedDetails: '••••4892 (USD)',
      verifiedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      isDefault: true,
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'pm-2',
      creatorId: 'creator-current',
      provider: 'sepa',
      maskedDetails: 'IBAN ••••9102 (EUR)',
      verifiedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      isDefault: false,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
  ]);

  const [payouts, setPayouts] = useState<PayoutDto[]>([
    {
      id: 'pay-101',
      creatorId: 'creator-current',
      methodId: 'pm-1',
      provider: 'payoneer',
      amountCents: 350000,
      currency: 'USD',
      status: 'completed',
      providerRef: 'PAYO_839218',
      manualReviewRequired: false,
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    },
  ]);

  const [statements] = useState<CreatorStatementDto[]>([
    {
      period: '2026-09',
      grossRevenueCents: 600000,
      platformFeeCents: 120000,
      netRevenueCents: 480000,
      refundsCents: 0,
      chargebacksCents: 0,
      payoutsTotalCents: 480000,
      currency: 'USD',
      transactionCount: 142,
      taxFormType: 'W-9 (US Citizen)',
    },
    {
      period: '2026-08',
      grossRevenueCents: 450000,
      platformFeeCents: 90000,
      netRevenueCents: 360000,
      refundsCents: 0,
      chargebacksCents: 0,
      payoutsTotalCents: 360000,
      currency: 'USD',
      transactionCount: 98,
      taxFormType: 'W-9 (US Citizen)',
    },
  ]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState('4800');
  const [selectedMethodId, setSelectedMethodId] = useState('pm-1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(requestAmount);
    if (!amountNum || amountNum < 20) return;

    const amountCents = Math.round(amountNum * 100);
    if (amountCents > availableCents) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setAvailableCents((prev) => prev - amountCents);
      const newPayout: PayoutDto = {
        id: `pay-${Date.now()}`,
        creatorId: 'creator-current',
        methodId: selectedMethodId,
        provider: 'payoneer',
        amountCents,
        currency: 'USD',
        status: amountCents >= 1000000 ? 'requested' : 'processing',
        manualReviewRequired: amountCents >= 1000000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPayouts([newPayout, ...payouts]);
      setIsSubmitting(false);
      setIsRequestModalOpen(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg text-white">
                <DollarSign className="w-7 h-7" />
              </div>
              Creator Payouts & Earnings
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Automated balance maturation, multi-gateway withdrawals, and monthly tax statements.
            </p>
          </div>

          <Button
            variant="primary"
            className="flex items-center gap-2 shadow-lg shadow-purple-900/40 font-bold"
            disabled={availableCents < 2000}
            onClick={() => setIsRequestModalOpen(true)}
          >
            <DollarSign className="w-4 h-4" />
            Request Withdrawal
          </Button>
        </div>

        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              Payout request submitted successfully. Funds moved to In-Transit ledger status.
            </span>
          </div>
        )}

        {/* Balance Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Available for Payout Card */}
          <Card className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Available for Payout
              </span>
              <Badge variant="success">Ready to Withdraw</Badge>
            </div>
            <div className="text-4xl font-extrabold text-white tracking-tight mb-2">
              ${(availableCents / 100).toFixed(2)}
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Fully matured funds (80% net earnings)
            </p>
          </Card>

          {/* Pending Holding Balance Card */}
          <Card className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Pending Maturation
              </span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mb-2">
              ${(pendingCents / 100).toFixed(2)}
            </div>
            <div className="p-2.5 bg-purple-950/30 rounded-xl border border-purple-900/40 text-[11px] text-purple-300">
              Holding Window: <strong className="text-white">{holdingDays} Days</strong> ({isMature ? 'Mature Account' : 'New Creator'})
            </div>
          </Card>

          {/* Compliance & Verification Status */}
          <Card className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Compliance Status
              </span>
              <Badge variant="success">Compliant</Badge>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span>18 U.S.C. §2257 Records:</span>
                <span className="text-emerald-400 font-semibold">Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax Profile (W-9):</span>
                <span className="text-emerald-400 font-semibold">Approved</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Moderation Status:</span>
                <span className="text-emerald-400 font-semibold">Clean (0 P0 Flags)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Payout Methods & 72h Cooldown Security Notice */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              Payout Methods
            </h2>
            <Button variant="secondary" size="sm" className="text-xs">
              + Add Payout Method
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payoutMethods.map((m) => (
              <Card
                key={m.id}
                className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    {m.provider === 'payoneer' ? (
                      <CreditCard className="w-6 h-6" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase tracking-wider">
                        {m.provider}
                      </span>
                      {m.isDefault && <Badge variant="purple">Default</Badge>}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">{m.maskedDetails}</div>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="success">Verified</Badge>
                  <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Cooldown passed
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Payout History & Statements Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payout History */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Recent Payout History
            </h2>
            <Card className="divide-y divide-zinc-800/60 bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden">
              {payouts.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">
                      ${(p.amountCents / 100).toFixed(2)} USD
                    </div>
                    <div className="text-xs text-zinc-500">
                      Via {p.provider.toUpperCase()} · {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={p.status === 'completed' ? 'success' : 'purple'}>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </Card>
          </div>

          {/* Monthly Statements & Tax Export */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Monthly Statements (1099-K / DAC7)
            </h2>
            <Card className="divide-y divide-zinc-800/60 bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden">
              {statements.map((s) => (
                <div key={s.period} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition">
                  <div>
                    <div className="text-sm font-bold text-white">{s.period} Statement</div>
                    <div className="text-xs text-zinc-400">
                      Gross: ${(s.grossRevenueCents / 100).toFixed(2)} · Net: ${(s.netRevenueCents / 100).toFixed(2)}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    PDF & CSV
                  </Button>
                </div>
              ))}
            </Card>
          </div>
        </div>

        {/* Withdrawal Modal */}
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md">
              <Card className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Request Payout</h3>
                  <button onClick={() => setIsRequestModalOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleRequestPayout} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Amount ($USD)</label>
                    <input
                      type="number"
                      min="20"
                      max={(availableCents / 100).toString()}
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Available: ${(availableCents / 100).toFixed(2)} · Min: $20.00</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-400">Destination Method</label>
                    <select
                      value={selectedMethodId}
                      onChange={(e) => setSelectedMethodId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      {payoutMethods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.provider.toUpperCase()} ({m.maskedDetails})
                        </option>
                      ))}
                    </select>
                  </div>

                  {Number(requestAmount) >= 10000 && (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300">
                      ⚠️ Payouts &ge; $10,000 require manual compliance approval before disbursement.
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="w-1/2" onClick={() => setIsRequestModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" className="w-1/2" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Confirm Payout'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
