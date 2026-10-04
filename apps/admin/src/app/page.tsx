import React from 'react';
import { Card, Badge } from '@lumora/ui';
import { ShieldCheck, Users, AlertTriangle, DollarSign } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trust & Safety Console</h1>
          <p className="text-xs text-zinc-400">Internal operations and moderation queues</p>
        </div>
        <Badge variant="purple">SSO Active · Staff Hardware Key Required</Badge>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow className="p-5 space-y-2 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase">KYC Queue</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">0 Pending</div>
          <p className="text-[11px] text-zinc-500">Target SLA: &lt; 24h</p>
        </Card>

        <Card glow className="p-5 space-y-2 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase">P0 Moderation</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">0 Cases</div>
          <p className="text-[11px] text-zinc-500">Target SLA: &lt; 15 min</p>
        </Card>

        <Card glow className="p-5 space-y-2 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase">Media In Review</span>
            <ShieldCheck className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-bold text-white">0 Items</div>
          <p className="text-[11px] text-zinc-500">Auto-approved: 100%</p>
        </Card>

        <Card glow className="p-5 space-y-2 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase">Payout Queue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">0 Pending</div>
          <p className="text-[11px] text-zinc-500">Hold threshold: 3–7d</p>
        </Card>
      </div>
    </div>
  );
}
