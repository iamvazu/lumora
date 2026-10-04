'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@lumora/ui';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
  AlertOctagon,
  ArrowUpRight,
  Coffee,
} from 'lucide-react';

interface QueueItem {
  id: string;
  targetType: string;
  targetId: string;
  source: string;
  priority: number; // 0=P0, 1=P1, 2=P2
  status: string;
  signals?: {
    csamMatch?: boolean;
    csamHash?: string;
    detectedFaceCount?: number;
    verifiedPerformerCount?: number;
    performerMismatch?: boolean;
    nudityScore?: number;
    reporterReason?: string;
  };
  reporterReason?: string;
  createdAt: string;
}

const SAMPLE_QUEUE: QueueItem[] = [
  {
    id: 'case-p0-101',
    targetType: 'media',
    targetId: '777e4567-e89b-12d3-a456-426614174000',
    source: 'hash_match',
    priority: 0,
    status: 'actioned',
    signals: {
      csamMatch: true,
      csamHash: 'test_csam_hash_match',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'case-p1-102',
    targetType: 'media',
    targetId: '888e4567-e89b-12d3-a456-426614174001',
    source: 'classifier',
    priority: 1,
    status: 'open',
    signals: {
      detectedFaceCount: 2,
      verifiedPerformerCount: 1,
      performerMismatch: true,
      nudityScore: 0.92,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'case-p1-103',
    targetType: 'post',
    targetId: '999e4567-e89b-12d3-a456-426614174002',
    source: 'report',
    priority: 1,
    status: 'open',
    reporterReason: 'non_consensual',
    signals: {
      reporterReason: 'non_consensual',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'case-p2-104',
    targetType: 'creator',
    targetId: 'aaa-4567-e89b-12d3-a456-426614174003',
    source: 'report',
    priority: 2,
    status: 'open',
    reporterReason: 'spam_fraud',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

export default function ModerationConsolePage() {
  // Welfare controls
  const [blurByDefault, setBlurByDefault] = useState(true);
  const [grayscaleMode, setGrayscaleMode] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [breakDue, setBreakDue] = useState(false);

  // Filter & Active Case
  const [priorityFilter, setPriorityFilter] = useState<number | 'all'>('all');
  const [activeCase, setActiveCase] = useState<QueueItem | null>(SAMPLE_QUEUE[1] || null);
  const [revealMedia, setRevealMedia] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [cases, setCases] = useState<QueueItem[]>(SAMPLE_QUEUE);

  // Welfare Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => {
        const next = prev + 1;
        if (next >= 1800 && !breakDue) {
          // 30 min break recommendation
          setBreakDue(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breakDue]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAction = (action: 'approve' | 'reject' | 'quarantine' | 'escalate') => {
    if (!activeCase) return;

    setCases((prev) =>
      prev.map((c) =>
        c.id === activeCase.id
          ? { ...c, status: action === 'escalate' ? 'escalated' : 'actioned' }
          : c
      )
    );

    setActiveCase(null);
    setRevealMedia(false);
    setDecisionNotes('');
  };

  const filteredCases = cases.filter((c) => {
    if (priorityFilter === 'all') return true;
    return c.priority === priorityFilter;
  });

  return (
    <div
      className={`min-h-screen bg-zinc-950 p-6 space-y-6 max-w-7xl mx-auto transition-all ${
        grayscaleMode ? 'contrast-105' : ''
      }`}
    >
      {/* Top Bar with Welfare Tools */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              Trust & Safety Moderation Console
            </h1>
            <Badge variant="purple">SLA Monitored</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time compliance triage with zero-tolerance safety automation
          </p>
        </div>

        {/* Moderator Welfare Controls */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Shift: {formatTimer(sessionSeconds)}</span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          <button
            onClick={() => setBlurByDefault(!blurByDefault)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              blurByDefault ? 'bg-purple-900/50 text-purple-300' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {blurByDefault ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Blur: {blurByDefault ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setGrayscaleMode(!grayscaleMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              grayscaleMode ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Grayscale: {grayscaleMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {breakDue && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-200 text-xs">
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Wellness Reminder:</strong> You have been reviewing queue items for over 30
              minutes. Take a 5-minute break to rest your eyes.
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setBreakDue(false)}>
            Dismiss Reminder
          </Button>
        </div>
      )}

      {/* Main Split View: Queue List & Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Priority:</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setPriorityFilter('all')}
                className={`px-2.5 py-1 rounded-lg ${
                  priorityFilter === 'all'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All ({cases.length})
              </button>
              <button
                onClick={() => setPriorityFilter(0)}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                  priorityFilter === 0
                    ? 'bg-rose-950 text-rose-300 font-medium'
                    : 'text-zinc-500 hover:text-rose-400'
                }`}
              >
                P0 (CSAM)
              </button>
              <button
                onClick={() => setPriorityFilter(1)}
                className={`px-2.5 py-1 rounded-lg ${
                  priorityFilter === 1
                    ? 'bg-amber-950 text-amber-300 font-medium'
                    : 'text-zinc-500 hover:text-amber-400'
                }`}
              >
                P1 (Performers/Reports)
              </button>
              <button
                onClick={() => setPriorityFilter(2)}
                className={`px-2.5 py-1 rounded-lg ${
                  priorityFilter === 2
                    ? 'bg-blue-950 text-blue-300 font-medium'
                    : 'text-zinc-500 hover:text-blue-400'
                }`}
              >
                P2
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredCases.map((item) => {
              const isSelected = activeCase?.id === item.id;
              return (
                <Card
                  key={item.id}
                  onClick={() => {
                    setActiveCase(item);
                    setRevealMedia(false);
                  }}
                  className={`p-4 cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-purple-500/80 bg-zinc-900/90 shadow-lg shadow-purple-950/20'
                      : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      {item.priority === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/80 text-rose-200 border border-rose-700">
                          P0 · CSAM IMMEDIATE
                        </span>
                      ) : item.priority === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/80 text-amber-200 border border-amber-700">
                          P1 · HUMAN REVIEW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/80 text-blue-200 border border-blue-700">
                          P2 · STANDARD
                        </span>
                      )}
                      <span className="text-zinc-500 uppercase">{item.targetType}</span>
                    </div>

                    <span className="text-[11px] text-zinc-500 font-mono">
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-200 font-medium line-clamp-1">
                    {item.signals?.csamMatch
                      ? '🚨 PhotoDNA Hash Match — Auto-Quarantined'
                      : item.signals?.performerMismatch
                      ? `⚠️ 2257 Performer Mismatch: ${item.signals.detectedFaceCount} faces vs ${item.signals.verifiedPerformerCount} consent form`
                      : item.reporterReason
                      ? `Reported: ${item.reporterReason}`
                      : 'Standard Compliance Queue Item'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                    <span>Source: {item.source}</span>
                    <span>Target: {item.targetId.substring(0, 8)}...</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Inspection Panel */}
        <div className="lg:col-span-7">
          {activeCase ? (
            <Card className="p-6 space-y-6 border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      Case #{activeCase.id}
                    </h2>
                    {activeCase.priority === 0 && (
                      <Badge variant="danger">P0 Escalated</Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Target Type: <span className="text-zinc-200">{activeCase.targetType}</span> · ID: {activeCase.targetId}
                  </p>
                </div>

                <Badge variant={activeCase.status === 'open' ? 'warning' : 'success'}>
                  {activeCase.status.toUpperCase()}
                </Badge>
              </div>

              {/* Signals Breakdown */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Automated Signal Diagnostics
                </h3>

                {activeCase.signals?.csamMatch && (
                  <div className="bg-rose-950/50 border border-rose-800/80 rounded-lg p-3 text-xs text-rose-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      Known CSAM Blacklist Match Detected
                    </div>
                    <p className="text-[11px] text-rose-300/90 font-mono">
                      Hash: {activeCase.signals.csamHash}
                    </p>
                    <p className="text-[11px] text-rose-400">
                      Action Taken: Payouts frozen, creator suspended, NCMEC report filed automatically.
                    </p>
                  </div>
                )}

                {activeCase.signals?.performerMismatch && (
                  <div className="bg-amber-950/40 border border-amber-800/70 rounded-lg p-3 text-xs text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      18 U.S.C. §2257 Performer Consent Mismatch
                    </div>
                    <p className="text-[11px] text-amber-300/90">
                      Visual classifier detected <strong>{activeCase.signals.detectedFaceCount} performers</strong>, but only <strong>{activeCase.signals.verifiedPerformerCount} performer release consent</strong> is linked.
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Nudity Score: {(activeCase.signals.nudityScore! * 100).toFixed(0)}%
                    </p>
                  </div>
                )}

                {activeCase.reporterReason && (
                  <div className="text-xs text-zinc-300">
                    <span className="text-zinc-500">User Report Reason:</span>{' '}
                    <span className="font-semibold">{activeCase.reporterReason}</span>
                  </div>
                )}
              </div>

              {/* Media Preview Box (Welfare protected) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Evidence Asset Preview</span>
                  <button
                    onClick={() => setRevealMedia(!revealMedia)}
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {revealMedia ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {revealMedia ? 'Obscure Asset' : 'Temporarily Reveal'}
                  </button>
                </div>

                <div className="relative aspect-video rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-tr from-purple-950/30 via-zinc-900 to-zinc-950 flex items-center justify-center ${
                      blurByDefault && !revealMedia ? 'blur-2xl scale-110' : ''
                    } ${grayscaleMode ? 'grayscale' : ''}`}
                  >
                    <div className="text-zinc-600 text-xs font-mono">
                      [Encrypted Media Payload: {activeCase.targetId.substring(0, 16)}]
                    </div>
                  </div>

                  {blurByDefault && !revealMedia && (
                    <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                      <EyeOff className="w-6 h-6 text-zinc-400" />
                      <span className="text-xs text-zinc-300 font-medium">
                        Media Obscured by Moderator Welfare Policy
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setRevealMedia(true)}>
                        Click to Reveal Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision Action Buttons */}
              <div className="space-y-3 pt-2">
                <Input
                  label="Moderation Action Notes / Legal Reference"
                  placeholder="e.g. Verified §2257 release ID on file, or copyright notice matched..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <Button
                    variant="primary"
                    onClick={() => handleAction('approve')}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleAction('reject')}
                    className="flex items-center justify-center gap-1.5 border-amber-800/80 text-amber-300 hover:bg-amber-950/50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleAction('quarantine')}
                    className="flex items-center justify-center gap-1.5 border-rose-800/80 text-rose-300 hover:bg-rose-950/50"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    Quarantine
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleAction('escalate')}
                    className="flex items-center justify-center gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Escalate
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-zinc-500 text-xs">
              <ShieldCheck className="w-8 h-8 text-zinc-700 mb-2" />
              Select a case from the queue to start review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
