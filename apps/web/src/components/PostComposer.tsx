'use client';

import React, { useState } from 'react';
import { Card, Button, PriceInput } from '@lumora/ui';
import {
  Image,
  Video,
  Globe,
  Users,
  DollarSign,
  Sparkles,
  X,
} from 'lucide-react';
import type { PostVisibility } from '@lumora/contracts';

interface PostComposerProps {
  onPostCreated?: (post: any) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('subscribers');
  const [priceCents, setPriceCents] = useState<number>(999);
  const [selectedMedia, setSelectedMedia] = useState<{ id: string; name: string; type: string }[]>([]);
  const [selectedPerformers, setSelectedPerformers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSampleMedia = (type: 'image' | 'video') => {
    const id = `media-${Date.now()}`;
    setSelectedMedia((prev) => [
      ...prev,
      {
        id,
        name: type === 'image' ? `photo_${prev.length + 1}.jpg` : `video_${prev.length + 1}.mp4`,
        type,
      },
    ]);
  };

  const handleRemoveMedia = (id: string) => {
    setSelectedMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && selectedMedia.length === 0) return;

    setIsSubmitting(true);

    try {
      const payload = {
        body,
        visibility,
        priceCents: visibility === 'ppv' ? priceCents : null,
        mediaIds: selectedMedia.map((m) => m.id),
        performerIds: selectedPerformers,
      };

      onPostCreated?.(payload);

      setBody('');
      setSelectedMedia([]);
      setSelectedPerformers([]);
      setVisibility('subscribers');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5 space-y-4 border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md rounded-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Post Textarea */}
        <div>
          <textarea
            rows={3}
            placeholder="Share something with your fans..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none"
          />
        </div>

        {/* Selected Media Chips */}
        {selectedMedia.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedMedia.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300"
              >
                {m.type === 'image' ? (
                  <Image className="w-3.5 h-3.5 text-pink-400" />
                ) : (
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>{m.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(m.id)}
                  className="text-zinc-500 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Visibility Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddSampleMedia('image')}
              className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Add Image"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleAddSampleMedia('video')}
              className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Add Video"
            >
              <Video className="w-4 h-4" />
            </button>

            {/* Visibility Selector */}
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  visibility === 'public'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility('subscribers')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  visibility === 'subscribers'
                    ? 'bg-purple-900/60 text-purple-200 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Subscribers
              </button>
              <button
                type="button"
                onClick={() => setVisibility('ppv')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  visibility === 'ppv'
                    ? 'bg-pink-900/60 text-pink-200 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                PPV
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || (!body.trim() && selectedMedia.length === 0)}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? 'Publishing...' : 'Publish Post'}
          </Button>
        </div>

        {/* PPV Price Input (Conditional) */}
        {visibility === 'ppv' && (
          <div className="pt-2">
            <PriceInput
              label="Pay-Per-View Price (Fans pay this amount to unlock this post)"
              cents={priceCents}
              onChangeCents={setPriceCents}
              minCents={300}
              maxCents={20000}
            />
          </div>
        )}
      </form>
    </Card>
  );
};
