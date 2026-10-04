'use client';

import React, { useState } from 'react';
import { Card, Badge } from '@lumora/ui';
import {
  Users,
  Bookmark,
  TrendingUp,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { PostCard } from '../../../components/PostCard';
import { PostComposer } from '../../../components/PostComposer';
import type { PostDto } from '@lumora/contracts';

const SAMPLE_FEED: PostDto[] = [
  {
    id: 'feed-post-1',
    creatorId: 'c-1',
    creatorHandle: 'sophiagrey',
    creatorDisplayName: 'Sophia Grey',
    body: 'Exclusive preview of this week’s tropical set 🌺 Full 4K set is live for subscribers now!',
    visibility: 'subscribers',
    priceCents: null,
    status: 'published',
    pinned: false,
    likeCount: 520,
    commentCount: 42,
    isLiked: true,
    isBookmarked: false,
    isEntitled: false,
    media: [
      {
        id: 'feed-m-1',
        kind: 'image',
        status: 'approved',
        blurredUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60',
        isEntitled: false,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'feed-post-2',
    creatorId: 'c-2',
    creatorHandle: 'elena_v',
    creatorDisplayName: 'Elena Vance',
    body: 'Backstage rehearsal vibes! 🩰 Catch the full livestream tonight at 8 PM UTC.',
    visibility: 'public',
    priceCents: null,
    status: 'published',
    pinned: false,
    likeCount: 310,
    commentCount: 19,
    isLiked: false,
    isBookmarked: true,
    isEntitled: true,
    media: [
      {
        id: 'feed-m-2',
        kind: 'image',
        status: 'approved',
        thumbUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        blurredUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=60',
        isEntitled: true,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

const SUGGESTED_CREATORS = [
  { handle: 'sophiagrey', name: 'Sophia Grey', category: 'Glamour', subs: '1.8k' },
  { handle: 'elena_v', name: 'Elena Vance', category: 'Art & Cosplay', subs: '3.4k' },
  { handle: 'marcus_fit', name: 'Marcus Cole', category: 'Fitness', subs: '920' },
];

export default function FeedPage() {
  const [filter, setFilter] = useState<'all' | 'subscribed' | 'bookmarks'>('all');
  const [posts, setPosts] = useState<PostDto[]>(SAMPLE_FEED);

  const handlePostCreated = (newPostData: any) => {
    const post: PostDto = {
      id: `local-post-${Date.now()}`,
      creatorId: 'my-creator-id',
      creatorHandle: 'you',
      creatorDisplayName: 'You',
      body: newPostData.body,
      visibility: newPostData.visibility,
      priceCents: newPostData.priceCents,
      status: 'published',
      pinned: false,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      isBookmarked: false,
      isEntitled: true,
      media: newPostData.mediaIds.map((id: string) => ({
        id,
        kind: 'image',
        status: 'approved',
        thumbUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
        blurredUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=60',
        isEntitled: true,
      })),
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [post, ...prev]);
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'bookmarks') return p.isBookmarked;
    if (filter === 'subscribed') return p.visibility === 'subscribers';
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Post Composer */}
          <PostComposer onPostCreated={handlePostCreated} />

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                For You
              </button>
              <button
                onClick={() => setFilter('subscribed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  filter === 'subscribed'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Subscribed
              </button>
              <button
                onClick={() => setFilter('bookmarks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  filter === 'bookmarks'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Bookmarks
              </button>
            </div>

            <Badge variant="purple">Live Updates</Badge>
          </div>

          {/* Posts Stream */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                No posts found in this feed.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUnlockClick={(p) => alert(`Unlock post ${p.id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar: Suggestions & Trending */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <Card className="p-5 space-y-4 border-zinc-800 bg-zinc-900/60 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                Featured Creators
              </span>
            </div>

            <div className="space-y-3">
              {SUGGESTED_CREATORS.map((sc) => (
                <div key={sc.handle} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                      {sc.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1">
                        {sc.name}
                        <CheckCircle2 className="w-3 h-3 text-purple-400" />
                      </div>
                      <div className="text-[11px] text-zinc-500">@{sc.handle}</div>
                    </div>
                  </div>

                  <a
                    href={`/${sc.handle}`}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
