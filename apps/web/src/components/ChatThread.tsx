'use client';

import React, { useState } from 'react';
import { Button, Badge } from '@lumora/ui';
import {
  Send,
  Lock,
  DollarSign,
  Image as ImageIcon,
  Heart,
  CheckCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import type { MessageDto, ConversationDto } from '@lumora/contracts';

interface ChatThreadProps {
  conversation: ConversationDto;
  messages: MessageDto[];
  currentUserId: string;
  isCreator: boolean;
  onSendMessage: (body: string, priceCents?: number | null, mediaIds?: string[]) => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  conversation,
  messages,
  currentUserId,
  isCreator,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [ppvPrice, setPpvPrice] = useState<string>('');
  const [showPpvInput, setShowPpvInput] = useState(false);
  const [unlockModalPost, setUnlockModalPost] = useState<{
    messageId: string;
    priceCents: number;
  } | null>(null);
  const [tipModalOpen, setTipModalOpen] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !showPpvInput) return;

    const priceCents = showPpvInput && Number(ppvPrice) ? Math.round(Number(ppvPrice) * 100) : null;
    onSendMessage(inputText.trim(), priceCents);
    setInputText('');
    setPpvPrice('');
    setShowPpvInput(false);
  };

  const partnerHandle = isCreator ? conversation.fanHandle : conversation.creatorHandle;
  const partnerName = isCreator ? conversation.fanDisplayName : conversation.creatorDisplayName;

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden">
      {/* Thread Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {partnerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">{partnerName}</span>
              <span className="text-xs text-zinc-500">@{partnerHandle}</span>
              {isCreator && (
                <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                  Subscribed
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
          </div>
        </div>

        {/* Fan Tip Button */}
        {!isCreator && (
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5 text-xs text-pink-400 border-pink-500/30 hover:bg-pink-950/40"
            onClick={() => setTipModalOpen(true)}
          >
            <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
            Send Tip
          </Button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <Sparkles className="w-10 h-10 text-purple-500/40 mb-2" />
            <p className="text-sm font-medium text-zinc-300">Direct Message Thread</p>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Encrypted 1:1 conversation. Send private messages, PPV sets, and tips.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-3.5 shadow-md ${
                    isMe
                      ? 'bg-purple-600 text-white rounded-br-xs'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                  }`}
                >
                  {/* Agency Staff attribution if applicable */}
                  {msg.sentByStaffId && (
                    <div className="flex items-center gap-1 text-[10px] text-purple-200/80 mb-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Verified Assistant</span>
                    </div>
                  )}

                  {/* PPV Lock Card */}
                  {msg.isLocked ? (
                    <div className="p-4 bg-zinc-950/80 border border-purple-500/40 rounded-xl space-y-3 text-center my-1">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Locked Premium Media</div>
                        <div className="text-[11px] text-zinc-400">
                          Unlock for ${((msg.priceCents || 0) / 100).toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                          setUnlockModalPost({
                            messageId: msg.id,
                            priceCents: msg.priceCents || 1000,
                          })
                        }
                      >
                        Unlock Media · ${((msg.priceCents || 0) / 100).toFixed(2)}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  )}

                  {/* Media Previews */}
                  {msg.media && msg.media.length > 0 && !msg.isLocked && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                      <div className="h-40 bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                        🎬 Premium Video / Photo Asset
                      </div>
                    </div>
                  )}

                  {/* Footer: timestamp + read receipts */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                      isMe ? 'text-purple-200/80' : 'text-zinc-500'
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-purple-200" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800/80 bg-zinc-900/50 space-y-2">
        {/* PPV Pricing Toggle (for Creators) */}
        {showPpvInput && isCreator && (
          <div className="p-2.5 bg-purple-950/40 border border-purple-800/60 rounded-xl flex items-center justify-between text-xs">
            <span className="text-purple-300 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> PPV Lock Price ($USD)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="3"
                max="200"
                value={ppvPrice}
                onChange={(e) => setPpvPrice(e.target.value)}
                placeholder="e.g. 15"
                className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPpvInput(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isCreator && (
            <button
              type="button"
              onClick={() => setShowPpvInput(!showPpvInput)}
              className={`p-2 rounded-xl border transition ${
                showPpvInput
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Add PPV Lock"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition"
            title="Attach Vault Media"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a direct message..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />

          <Button type="submit" variant="primary" size="sm" className="px-3.5 py-2.5 rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Unlock PPV Modal */}
      {unlockModalPost && (
        <CheckoutModal
          isOpen={true}
          onClose={() => setUnlockModalPost(null)}
          type="ppv"
          title="Unlock Direct Message Media"
          creatorName={conversation.creatorDisplayName}
          creatorHandle={conversation.creatorHandle}
          creatorId={conversation.creatorId}
          resourceId={unlockModalPost.messageId}
          priceCents={unlockModalPost.priceCents}
        />
      )}

      {/* Tip Creator Modal */}
      {tipModalOpen && (
        <CheckoutModal
          isOpen={true}
          onClose={() => setTipModalOpen(false)}
          type="tip"
          title="Tip Creator"
          creatorName={conversation.creatorDisplayName}
          creatorHandle={conversation.creatorHandle}
          creatorId={conversation.creatorId}
          priceCents={1000}
        />
      )}
    </div>
  );
};
