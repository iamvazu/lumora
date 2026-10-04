'use client';

import React, { useState } from 'react';
import { Card, Button } from '@lumora/ui';
import {
  MessageSquare,
  Search,
  Megaphone,
  Lock,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { ChatThread } from '@/components/ChatThread';
import type { ConversationDto, MessageDto } from '@lumora/contracts';

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'mass_message'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');

  // Mass message states
  const [massBody, setMassBody] = useState('');
  const [massPrice, setMassPrice] = useState('');
  const [massSegment, setMassSegment] = useState<'all_subscribers' | 'expired_subscribers' | 'top_spenders'>('all_subscribers');
  const [isSendingMass, setIsSendingMass] = useState(false);
  const [massSuccessToast, setMassSuccessToast] = useState(false);

  const [conversations, setConversations] = useState<ConversationDto[]>([
    {
      id: 'conv-1',
      creatorId: 'creator-1',
      creatorUserId: 'user-c1',
      creatorHandle: 'sierra_sky',
      creatorDisplayName: 'Sierra Sky',
      fanId: 'fan-current',
      fanHandle: 'you',
      fanDisplayName: 'You',
      unreadCount: 0,
      lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      lastMessage: {
        id: 'm-101',
        conversationId: 'conv-1',
        senderId: 'user-c1',
        senderHandle: 'sierra_sky',
        senderDisplayName: 'Sierra Sky',
        body: 'Just posted the new behind-the-scenes set! Let me know what you think 🔥',
        priceCents: null,
        isLocked: false,
        isUnlocked: true,
        isMass: false,
        media: [],
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'conv-2',
      creatorId: 'creator-2',
      creatorUserId: 'user-c2',
      creatorHandle: 'elena_rose',
      creatorDisplayName: 'Elena Rose',
      fanId: 'fan-current',
      fanHandle: 'you',
      fanDisplayName: 'You',
      unreadCount: 1,
      lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      lastMessage: {
        id: 'm-102',
        conversationId: 'conv-2',
        senderId: 'user-c2',
        senderHandle: 'elena_rose',
        senderDisplayName: 'Elena Rose',
        body: '🔒 Locked PPV Message',
        priceCents: 1500,
        isLocked: true,
        isUnlocked: false,
        isMass: false,
        media: [],
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    },
  ]);

  const [threadMessages, setThreadMessages] = useState<Record<string, MessageDto[]>>({
    'conv-1': [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-c1',
        senderHandle: 'sierra_sky',
        senderDisplayName: 'Sierra Sky',
        body: 'Hey there! Thanks for subscribing to my VIP tier ❤️',
        priceCents: null,
        isLocked: false,
        isUnlocked: true,
        isMass: false,
        media: [],
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'fan-current',
        senderHandle: 'you',
        senderDisplayName: 'You',
        body: 'Love your photography! Keep it up.',
        priceCents: null,
        isLocked: false,
        isUnlocked: true,
        isMass: false,
        media: [],
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        senderId: 'user-c1',
        senderHandle: 'sierra_sky',
        senderDisplayName: 'Sierra Sky',
        body: 'Just posted the new behind-the-scenes set! Let me know what you think 🔥',
        priceCents: null,
        isLocked: false,
        isUnlocked: true,
        isMass: false,
        media: [],
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
    'conv-2': [
      {
        id: 'msg-201',
        conversationId: 'conv-2',
        senderId: 'user-c2',
        senderHandle: 'elena_rose',
        senderDisplayName: 'Elena Rose',
        body: 'Hey! Here is an exclusive clip from tonight shoot.',
        priceCents: 1500,
        isLocked: true,
        isUnlocked: false,
        isMass: false,
        media: [
          {
            id: 'mm-201',
            mediaId: 'med-201',
            position: 0,
            isLocked: true,
          },
        ],
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  });

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const activeMessages = threadMessages[selectedConvId] || [];

  const handleSendMessage = (body: string, priceCents?: number | null) => {
    const newMsg: MessageDto = {
      id: `local-msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: 'fan-current',
      senderHandle: 'you',
      senderDisplayName: 'You',
      body,
      priceCents: priceCents || null,
      isLocked: false,
      isUnlocked: true,
      isMass: false,
      media: [],
      createdAt: new Date().toISOString(),
    };

    setThreadMessages((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
    }));

    // Update conversation snippet
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? {
              ...c,
              lastMessageAt: new Date().toISOString(),
              lastMessage: newMsg,
            }
          : c,
      ),
    );
  };

  const handleSendMassMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!massBody.trim()) return;

    setIsSendingMass(true);
    setTimeout(() => {
      setIsSendingMass(false);
      setMassSuccessToast(true);
      setMassBody('');
      setMassPrice('');
      setTimeout(() => setMassSuccessToast(false), 3000);
    }, 600);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.creatorDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.creatorHandle.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg">
                <MessageSquare className="w-6 h-6" />
              </div>
              Direct Messages
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time 1:1 messaging, locked PPV media attachments, and mass broadcast fan-out.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'inbox'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Conversations
            </button>
            <button
              onClick={() => setActiveTab('mass_message')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'mass_message'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              Mass Broadcast
            </button>
          </div>
        </div>

        {/* Content Layout */}
        {activeTab === 'inbox' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[720px]">
            {/* Left Column: Inbox List */}
            <Card className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col h-full overflow-hidden">
              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
                {filteredConversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full p-3 text-left rounded-xl transition flex items-center gap-3 my-1 ${
                      selectedConvId === c.id
                        ? 'bg-purple-950/40 border border-purple-800/60'
                        : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                      {c.creatorDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {c.creatorDisplayName}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(c.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {c.lastMessage?.body || 'No messages yet'}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="w-4.5 h-4.5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Right Column: Active Chat Thread */}
            <div className="md:col-span-2 h-full">
              {selectedConv ? (
                <ChatThread
                  conversation={selectedConv}
                  messages={activeMessages}
                  currentUserId="fan-current"
                  isCreator={false}
                  onSendMessage={handleSendMessage}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                  Select a conversation to start chatting.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mass Broadcast Tab */
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Mass Message Broadcast</h2>
                  <p className="text-xs text-zinc-400">
                    Fan-out private messages to hundreds or thousands of subscribers in chunks of 1,000.
                  </p>
                </div>
              </div>

              {massSuccessToast && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Mass message queued for batch fan-out (50,000 max / hour rate limit).
                </div>
              )}

              <form onSubmit={handleSendMassMessage} className="space-y-4">
                {/* Audience Segmentation */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-purple-400" /> Select Target Audience
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMassSegment('all_subscribers')}
                      className={`p-3 text-xs font-semibold rounded-xl border text-left transition ${
                        massSegment === 'all_subscribers'
                          ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-white font-bold mb-0.5">All Active</div>
                      <div className="text-[10px] text-zinc-400">All current VIP subscribers</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMassSegment('expired_subscribers')}
                      className={`p-3 text-xs font-semibold rounded-xl border text-left transition ${
                        massSegment === 'expired_subscribers'
                          ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-white font-bold mb-0.5">Win-Back</div>
                      <div className="text-[10px] text-zinc-400">Expired / cancelled subs</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMassSegment('top_spenders')}
                      className={`p-3 text-xs font-semibold rounded-xl border text-left transition ${
                        massSegment === 'top_spenders'
                          ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-white font-bold mb-0.5">Top Spenders</div>
                      <div className="text-[10px] text-zinc-400">Fans who spent &gt; $50</div>
                    </button>
                  </div>
                </div>

                {/* Broadcast Body */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Message Content</label>
                  <textarea
                    rows={4}
                    value={massBody}
                    onChange={(e) => setMassBody(e.target.value)}
                    placeholder="Write your broadcast message..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                    required
                  />
                </div>

                {/* Optional PPV Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-purple-400" /> Optional PPV Unlock Price ($USD)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="200"
                    value={massPrice}
                    onChange={(e) => setMassPrice(e.target.value)}
                    placeholder="Leave blank for free broadcast message"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Rate limit note */}
                <p className="text-[11px] text-zinc-500">
                  ⚡ Creators are rate limited to 5 mass broadcasts per hour. Blocked fans are automatically excluded.
                </p>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 text-xs font-bold"
                  disabled={isSendingMass || !massBody.trim()}
                >
                  {isSendingMass ? 'Queueing Broadcast...' : 'Queue Mass Message Fan-out'}
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
