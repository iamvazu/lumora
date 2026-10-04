'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@lumora/ui';
import {
  Radio,
  Users,
  DollarSign,
  Send,
  Sparkles,
  Gift,
  Target,
  ShieldCheck,
  Volume2,
  Maximize2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  userHandle: string;
  userDisplayName: string;
  body: string;
  tipAmountCents: number | null;
  createdAt: string;
}

export default function LiveStreamPage() {
  const params = useParams();
  const streamId = params?.['streamId'] as string;

  const [stream, setStream] = useState({
    id: streamId || 'mock-stream-id',
    title: 'Late Night Studio Q&A & Exclusive Acoustic Session 🎸✨',
    creatorHandle: 'elena_valkyrie',
    creatorDisplayName: 'Elena Valkyrie',
    status: 'live',
    access: 'subscribers',
    viewerCount: 1420,
    tipGoalCents: 50000, // $500.00
    tipProgressCents: 32000, // $320.00
    isEntitled: true,
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      userHandle: 'alex_fan99',
      userDisplayName: 'Alex',
      body: 'Sound and video quality are crisp tonight!! ❤️🔥',
      tipAmountCents: null,
      createdAt: '10:42 PM',
    },
    {
      id: 'm2',
      userHandle: 'crypto_whale',
      userDisplayName: 'Marcus W.',
      body: 'Can you play that new song you previewed yesterday?? Huge fan!',
      tipAmountCents: 5000, // $50.00 tip!
      createdAt: '10:43 PM',
    },
    {
      id: 'm3',
      userHandle: 'sarah_m',
      userDisplayName: 'Sarah',
      body: 'Loving the vibe! Cheers from Berlin 🥂',
      tipAmountCents: null,
      createdAt: '10:44 PM',
    },
    {
      id: 'm4',
      userHandle: 'golden_supporter',
      userDisplayName: 'Dave K.',
      body: 'Keep crushing it Elena! You inspired me so much this week.',
      tipAmountCents: 2000, // $20.00 tip!
      createdAt: '10:45 PM',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('20');
  const [tipComment, setTipComment] = useState('');
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [tipSuccessAlert, setTipSuccessAlert] = useState<string | null>(null);

  const goalPercent = Math.min(
    100,
    Math.round((stream.tipProgressCents / stream.tipGoalCents) * 100)
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      userHandle: 'you',
      userDisplayName: 'You',
      body: inputText,
      tipAmountCents: null,
      createdAt: 'Just now',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleSendTip = async () => {
    const amountNum = parseFloat(tipAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    setIsSendingTip(true);
    const amountCents = Math.round(amountNum * 100);

    // Simulate API tip call
    setTimeout(() => {
      setStream((prev) => ({
        ...prev,
        tipProgressCents: prev.tipProgressCents + amountCents,
      }));

      const tipMsg: ChatMessage = {
        id: `tip-${Date.now()}`,
        userHandle: 'you',
        userDisplayName: 'You',
        body: tipComment || `Sent a $${amountNum.toFixed(2)} gift! 💖`,
        tipAmountCents: amountCents,
        createdAt: 'Just now',
      };

      setChatMessages((prev) => [...prev, tipMsg]);
      setIsSendingTip(false);
      setShowTipModal(false);
      setTipSuccessAlert(`Sent $${amountNum.toFixed(2)} Tip to @${stream.creatorHandle}! 🎉`);
      setTimeout(() => setTipSuccessAlert(null), 4000);
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      {/* Main Video & Details Viewport */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-6xl mx-auto w-full">
        {/* Stream Video Container */}
        <div className="relative aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center group">
          {/* Animated Background Gradients simulating live video broadcast */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/40 via-zinc-900 to-pink-950/30 animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-1 animate-bounce">
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center font-bold text-2xl text-purple-300">
                EV
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-zinc-100">
                {stream.creatorDisplayName} is Broadcasting Live
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Connected via Low-Latency LiveKit Ingress (1080p60)
              </p>
            </div>
          </div>

          {/* Top Overlay Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/90 text-white shadow-lg backdrop-blur-md animate-pulse">
              <Radio className="w-3.5 h-3.5" /> LIVE
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-zinc-200 backdrop-blur-md border border-white/10">
              <Users className="w-3.5 h-3.5 text-zinc-400" /> {stream.viewerCount.toLocaleString()}
            </span>
          </div>

          {/* Controls Bar (Hover) */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="flex items-center gap-3">
              <button className="p-2 text-zinc-300 hover:text-white transition">
                <Volume2 className="w-5 h-5" />
              </button>
              <span className="text-xs text-zinc-400 font-mono">01:42:18</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 2257 Verified
              </span>
              <button className="p-2 text-zinc-300 hover:text-white transition">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stream Info & Tip Goal */}
        <div className="mt-4 p-5 bg-zinc-900/70 border border-zinc-800 rounded-2xl backdrop-blur-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{stream.title}</h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Hosted by <span className="text-purple-400 font-medium">@{stream.creatorHandle}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() => setShowTipModal(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Gift className="w-4 h-4" /> Send Stream Tip
              </Button>
            </div>
          </div>

          {/* Tip Goal Bar */}
          <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-purple-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Current Stream Goal: Acoustic EP Vinyl Pressing
              </span>
              <span className="text-zinc-300">
                ${(stream.tipProgressCents / 100).toFixed(0)} / ${(stream.tipGoalCents / 100).toFixed(0)} ({goalPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Stream Chat Sidebar */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/90 flex flex-col h-[500px] lg:h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-white">Live Stream Chat</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
              Subscribers Only
            </span>
          </div>
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>

        {/* Tip Success Notification */}
        {tipSuccessAlert && (
          <div className="m-3 p-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 rounded-xl text-xs text-pink-200 font-medium text-center animate-pulse">
            {tipSuccessAlert}
          </div>
        )}

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-xl text-xs transition ${
                msg.tipAmountCents
                  ? 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-amber-500/30 shadow-md'
                  : 'bg-zinc-950/40 border border-zinc-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  {msg.userDisplayName}
                  <span className="text-[10px] text-zinc-500">@{msg.userHandle}</span>
                </span>
                {msg.tipAmountCents && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${(msg.tipAmountCents / 100).toFixed(2)} Tip
                  </span>
                )}
              </div>
              <p className="text-zinc-300 leading-relaxed">{msg.body}</p>
            </div>
          ))}
        </div>

        {/* Chat Input & Tip Trigger */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send a chat message..."
              className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowTipModal(true)}
              className="p-2 text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl transition"
              title="Tip creator"
            >
              <Gift className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="p-2 text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Gift className="w-5 h-5" />
                <h3 className="text-lg text-white">Send Tip to @{stream.creatorHandle}</h3>
              </div>
              <button
                onClick={() => setShowTipModal(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Tips appear highlighted on the live stream and contribute towards Elena's goal.
            </p>

            {/* Quick Amount Chips */}
            <div className="grid grid-cols-4 gap-2">
              {['5', '10', '20', '50'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    tipAmount === amt
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Custom Amount ($ USD)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Tip Comment */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Message / Song Request (Optional)</label>
              <textarea
                value={tipComment}
                onChange={(e) => setTipComment(e.target.value)}
                rows={2}
                placeholder="Say something nice or request a track..."
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                variant="secondary"
                onClick={() => setShowTipModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendTip}
                disabled={isSendingTip}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold"
              >
                {isSendingTip ? 'Processing...' : `Tip $${parseFloat(tipAmount || '0').toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
