'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Badge } from '@lumora/ui';
import {
  CheckCircle2,
  Image as ImageIcon,
  Share2,
  Lock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { PostCard } from '../../components/PostCard';
import type { CreatorProfileDto, PostDto } from '@lumora/contracts';

const SAMPLE_CREATOR: CreatorProfileDto = {
  id: 'creator-uuid-1',
  userId: 'user-uuid-1',
  handle: 'sophiagrey',
  displayName: 'Sophia Grey',
  bio: '✨ Exclusive glamour, artistic sets & behind-the-scenes content.\nNew full sets uploaded every Tuesday & Friday! 💖',
  category: ['Modeling', 'Cosplay', 'Lifestyle'],
  isPaid: true,
  subscriptionPriceCents: 1499, // $14.99/mo
  currency: 'USD',
  commentsEnabled: true,
  status: 'approved',
  followerCount: 24500,
  subscriberCount: 1820,
  postCount: 142,
  mediaCount: 380,
  isFollowing: false,
  isSubscribed: false,
};

const SAMPLE_POSTS: PostDto[] = [
  {
    id: 'post-1',
    creatorId: 'creator-uuid-1',
    creatorHandle: 'sophiagrey',
    creatorDisplayName: 'Sophia Grey',
    body: 'Golden hour at the private villa ✨ Full unedited 4K set just went live for all subscribers!',
    visibility: 'subscribers',
    priceCents: null,
    status: 'published',
    pinned: true,
    likeCount: 428,
    commentCount: 38,
    isLiked: false,
    isBookmarked: false,
    isEntitled: false,
    media: [
      {
        id: 'media-1',
        kind: 'image',
        status: 'approved',
        width: 1080,
        height: 1920,
        blurredUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60',
        isEntitled: false,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'post-2',
    creatorId: 'creator-uuid-1',
    creatorHandle: 'sophiagrey',
    creatorDisplayName: 'Sophia Grey',
    body: 'Behind the scenes video from yesterday’s shoot! 🎥 Available for pay-per-view unlock.',
    visibility: 'ppv',
    priceCents: 999, // $9.99
    status: 'published',
    pinned: false,
    likeCount: 182,
    commentCount: 12,
    isLiked: true,
    isBookmarked: true,
    isEntitled: false,
    media: [
      {
        id: 'media-2',
        kind: 'video',
        status: 'approved',
        width: 1920,
        height: 1080,
        blurredUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=60',
        isEntitled: false,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'post-3',
    creatorId: 'creator-uuid-1',
    creatorHandle: 'sophiagrey',
    creatorDisplayName: 'Sophia Grey',
    body: 'Welcome to all my new fans! Thank you so much for the love and support 💕',
    visibility: 'public',
    priceCents: null,
    status: 'published',
    pinned: false,
    likeCount: 650,
    commentCount: 54,
    isLiked: false,
    isBookmarked: false,
    isEntitled: true,
    media: [
      {
        id: 'media-3',
        kind: 'image',
        status: 'approved',
        width: 1080,
        height: 1080,
        thumbUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
        blurredUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=60',
        isEntitled: true,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export default function CreatorProfilePage() {
  const params = useParams();
  const handle = (params?.['handle'] as string) || 'sophiagrey';

  const [creator] = useState<CreatorProfileDto>(SAMPLE_CREATOR);
  const [posts] = useState<PostDto[]>(SAMPLE_POSTS);
  const [activeTab, setActiveTab] = useState<'all' | 'media' | 'locked'>('all');
  const [isFollowing, setIsFollowing] = useState(creator.isFollowing);
  const [followerCount, setFollowerCount] = useState(creator.followerCount);

  const handleFollowToggle = () => {
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowerCount((prev) => (next ? prev + 1 : prev - 1));
  };

  const handleUnlockPost = (post: PostDto) => {
    alert(
      post.visibility === 'ppv'
        ? `Unlocking PPV Post #${post.id} for $${((post.priceCents || 0) / 100).toFixed(2)} via double-entry ledger`
        : `Opening subscription checkout for @${creator.handle} ($${((creator.subscriptionPriceCents || 999) / 100).toFixed(2)}/mo)`
    );
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'media') return p.media && p.media.length > 0;
    if (activeTab === 'locked') return !p.isEntitled;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Banner */}
      <div className="relative h-60 md:h-80 w-full bg-gradient-to-r from-purple-900 via-pink-900 to-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Creator Bio Card */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-5 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl">
              {/* Avatar & Header */}
              <div className="flex items-start justify-between">
                <div className="relative -mt-14">
                  <div className="w-24 h-24 rounded-full border-4 border-zinc-900 bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl">
                    {creator.displayName.charAt(0)}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-zinc-900" />
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <Button
                    size="sm"
                    variant={isFollowing ? 'outline' : 'primary'}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>

              {/* Names & Verification */}
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {creator.displayName}
                  </h1>
                  <CheckCircle2 className="w-4 h-4 text-purple-400 fill-current" />
                </div>
                <p className="text-xs text-zinc-400">@{handle}</p>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-1.5">
                {creator.category.map((cat) => (
                  <Badge key={cat} variant="purple">
                    {cat}
                  </Badge>
                ))}
              </div>

              {/* Bio */}
              <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {creator.bio}
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-800/80 text-center">
                <div>
                  <div className="text-base font-bold text-white">
                    {followerCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Followers
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-white">
                    {creator.subscriberCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Subscribers
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-white">{creator.mediaCount}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Media Items
                  </div>
                </div>
              </div>

              {/* Subscription Card */}
              {creator.isPaid && (
                <div className="bg-gradient-to-br from-purple-950/40 via-zinc-900 to-pink-950/30 border border-purple-500/30 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                        Full VIP Access
                      </span>
                      <div className="text-2xl font-black text-white mt-0.5">
                        ${((creator.subscriptionPriceCents || 999) / 100).toFixed(2)}
                        <span className="text-xs font-normal text-zinc-400"> / month</span>
                      </div>
                    </div>
                    <Badge variant="purple">30-Day Pass</Badge>
                  </div>

                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Full unblurred access to all posts & 4K video</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Direct 1-on-1 priority messaging access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Cancel anytime with 1-click renewal control</span>
                    </li>
                  </ul>

                  <Button
                    variant="primary"
                    className="w-full py-3 text-sm font-bold shadow-lg shadow-purple-900/50"
                    onClick={() =>
                      alert(
                        `Initiating subscription to @${creator.handle} for $${(
                          (creator.subscriptionPriceCents || 999) / 100
                        ).toFixed(2)}`
                      )
                    }
                  >
                    Subscribe Now
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Posts Stream */}
          <div className="lg:col-span-7 space-y-5">
            {/* Feed Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All Posts ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'media'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Media Only
              </button>
              <button
                onClick={() => setActiveTab('locked')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'locked'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Locked VIP
              </button>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUnlockClick={handleUnlockPost}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
