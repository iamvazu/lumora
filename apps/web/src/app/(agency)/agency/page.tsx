'use client';

import React, { useState } from 'react';
import { Button } from '@lumora/ui';
import {
  Building2,
  Users,
  DollarSign,
  UserPlus,
  Shield,
  MessageSquare,
  Sparkles,
  Plus,
  ArrowUpRight,
  Lock,
} from 'lucide-react';

interface ManagedCreator {
  id: string;
  handle: string;
  displayName: string;
  splitPercent: number;
  status: 'active' | 'invited';
  monthlyGmvCents: number;
  agencyCutCents: number;
}

interface ChatterSeat {
  id: string;
  handle: string;
  displayName: string;
  role: 'manager' | 'chatter';
  scopes: string[];
  assignedCreators: string[];
}

export default function AgencyDashboardPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddChatterModal, setShowAddChatterModal] = useState(false);
  const [inviteHandle, setInviteHandle] = useState('');
  const [inviteSplit, setInviteSplit] = useState('20');

  const agencySummary = {
    name: 'Apex Media Talent LLC',
    legalEntityRef: 'Apex Media Talent LLC (DE-4920194)',
    status: 'active',
    totalGrossCents: 6840000, // $68,400.00
    agencyCommissionCents: 1094400, // $10,944.00 (avg 20% of creator net)
    creatorPayoutsCents: 4377600, // $43,776.00
    activeCreatorsCount: 4,
    chatterSeatsCount: 6,
  };

  const [managedCreators, setManagedCreators] = useState<ManagedCreator[]>([
    {
      id: 'mc1',
      handle: 'elena_valkyrie',
      displayName: 'Elena Valkyrie',
      splitPercent: 20,
      status: 'active',
      monthlyGmvCents: 3450000, // $34,500.00
      agencyCutCents: 552000, // $5,520.00
    },
    {
      id: 'mc2',
      handle: 'aria_cyber',
      displayName: 'Aria Takahashi',
      splitPercent: 15,
      status: 'active',
      monthlyGmvCents: 2100000, // $21,000.00
      agencyCutCents: 252000, // $2,520.00
    },
    {
      id: 'mc3',
      handle: 'chloe_noir',
      displayName: 'Chloe Noir',
      splitPercent: 20,
      status: 'active',
      monthlyGmvCents: 1290000, // $12,900.00
      agencyCutCents: 206400, // $2,064.00
    },
    {
      id: 'mc4',
      handle: 'neo_artisan',
      displayName: 'Neo Artisan',
      splitPercent: 25,
      status: 'invited',
      monthlyGmvCents: 0,
      agencyCutCents: 0,
    },
  ]);

  const chatterSeats: ChatterSeat[] = [
    {
      id: 'cs1',
      handle: 'marcus_manager',
      displayName: 'Marcus (Talent Lead)',
      role: 'manager',
      scopes: ['inbox:read', 'inbox:reply', 'creators:manage'],
      assignedCreators: ['All Creators'],
    },
    {
      id: 'cs2',
      handle: 'chatter_jordan',
      displayName: 'Jordan S.',
      role: 'chatter',
      scopes: ['inbox:read', 'inbox:reply'],
      assignedCreators: ['@elena_valkyrie', '@aria_cyber'],
    },
    {
      id: 'cs3',
      handle: 'chatter_sam',
      displayName: 'Sam K.',
      role: 'chatter',
      scopes: ['inbox:read', 'inbox:reply'],
      assignedCreators: ['@chloe_noir'],
    },
  ];

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteHandle.trim()) return;

    const newCreator: ManagedCreator = {
      id: `mc-${Date.now()}`,
      handle: inviteHandle.replace('@', ''),
      displayName: inviteHandle.replace('@', ''),
      splitPercent: parseInt(inviteSplit, 10) || 20,
      status: 'invited',
      monthlyGmvCents: 0,
      agencyCutCents: 0,
    };

    setManagedCreators((prev) => [...prev, newCreator]);
    setInviteHandle('');
    setShowInviteModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Building2 className="w-7 h-7 text-purple-400" /> {agencySummary.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30">
                Agency B2B
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Multi-creator management, revenue share accounting, and scoped chatter seats
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowAddChatterModal(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Chatter Seat
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowInviteModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <Plus className="w-3.5 h-3.5" /> Invite Creator
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Managed GMV */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Managed GMV (Gross)</span>
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white font-mono">
                ${(agencySummary.totalGrossCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" /> +22.4% this month
              </div>
            </div>
          </div>

          {/* Agency Commission */}
          <div className="p-5 bg-gradient-to-br from-purple-950/40 via-zinc-900/80 to-zinc-900 border border-purple-500/30 rounded-2xl flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-purple-300">
              <span className="text-xs font-semibold uppercase tracking-wider">Agency Net Commission</span>
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 font-mono">
                ${(agencySummary.agencyCommissionCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Directly available for payout</p>
            </div>
          </div>

          {/* Managed Creators */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Managed Creators</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white font-mono">
                {agencySummary.activeCreatorsCount}
              </p>
              <p className="text-xs text-zinc-400 mt-1">With explicit mutual consent</p>
            </div>
          </div>

          {/* Scoped Chatter Seats */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Chatter Seats</span>
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white font-mono">
                {agencySummary.chatterSeatsCount}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Strict financial 403 isolation</p>
            </div>
          </div>
        </div>

        {/* Managed Creators Table */}
        <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Managed Creator Roster</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Creator partnership terms and monthly performance</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Agency Split</th>
                  <th className="py-3 px-4">Monthly GMV</th>
                  <th className="py-3 px-4 text-right">Agency Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {managedCreators.map((creator) => (
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
                    <td className="py-3.5 px-4">
                      {creator.status === 'active' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active Partnership
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Invite Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                      {creator.splitPercent}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      ${(creator.monthlyGmvCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ${(creator.agencyCutCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chatter Seats Management */}
        <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" /> Scoped Chatter Seats & Access Roles
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Chatters can manage DMs & mass messaging. Financial statements & payout controls are strictly restricted.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Creators</th>
                  <th className="py-3 px-4">Permissions (Scopes)</th>
                  <th className="py-3 px-4 text-right">Financial Isolation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {chatterSeats.map((seat) => (
                  <tr key={seat.id} className="hover:bg-zinc-950/40 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-zinc-200">{seat.displayName}</p>
                      <p className="text-[11px] text-zinc-500">@{seat.handle}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          seat.role === 'manager'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {seat.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {seat.assignedCreators.join(', ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {seat.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 font-mono text-[10px] border border-zinc-800"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <Lock className="w-3 h-3" /> 403 Forbidden Blocked
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Creator Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" /> Invite Creator to Agency
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-zinc-500 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                The creator will receive an agency invitation in their dashboard. The partnership becomes active only after explicit creator consent.
              </p>

              <form onSubmit={handleSendInvite} className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Creator Handle</label>
                  <input
                    type="text"
                    required
                    value={inviteHandle}
                    onChange={(e) => setInviteHandle(e.target.value)}
                    placeholder="@handle"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Agency Revenue Split (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={inviteSplit}
                    onChange={(e) => setInviteSplit(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Standard agency commission is 15% - 25% of creator net volume.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Send Invitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Chatter Modal */}
        {showAddChatterModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" /> Assign Scoped Chatter Seat
                </h3>
                <button
                  onClick={() => setShowAddChatterModal(false)}
                  className="text-zinc-500 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                Grant inbox access to customer support staff or chat operators. Chatters cannot view payouts, earnings, or tax forms.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Staff User Handle</label>
                  <input
                    type="text"
                    placeholder="@chatter_username"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Role</label>
                  <select className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                    <option value="chatter">Chatter (Inbox Scoped Only)</option>
                    <option value="manager">Agency Manager (Manage Roster & Chatters)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowAddChatterModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowAddChatterModal(false)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Assign Seat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
