'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@lumora/ui';
import {
  Search,
  Sparkles,
  Flame,
  Users,
  Compass,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface CreatorCard {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  category: string[];
  subscriberCount: number;
  postCount: number;
  subscriptionPriceCents: number;
  avatarUrl: string | null;
  bannerGradient: string;
  isVerified: boolean;
}

export default function ExploreDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { slug: 'all', name: 'All Categories' },
    { slug: 'cosplay', name: 'Cosplay & Roleplay' },
    { slug: 'fitness', name: 'Fitness & Health' },
    { slug: 'art', name: 'Visual Art' },
    { slug: 'music', name: 'Music & Audio' },
    { slug: 'lifestyle', name: 'Lifestyle & Vlogs' },
    { slug: 'gaming', name: 'Gaming & Streams' },
  ];

  const featuredCreators: CreatorCard[] = [
    {
      id: 'c1',
      handle: 'elena_valkyrie',
      displayName: 'Elena Valkyrie',
      bio: 'Alternative fashion, digital art, acoustic sessions & exclusive behind-the-scenes drops ✨🎸',
      category: ['cosplay', 'music'],
      subscriberCount: 2450,
      postCount: 142,
      subscriptionPriceCents: 1499, // $14.99
      avatarUrl: null,
      bannerGradient: 'from-purple-900 via-indigo-950 to-pink-950',
      isVerified: true,
    },
    {
      id: 'c2',
      handle: 'marcus_fit',
      displayName: 'Marcus Strong',
      bio: 'High-intensity athletic training, meal plans, physique transformations & live coaching 🏋️‍♂️💪',
      category: ['fitness', 'lifestyle'],
      subscriberCount: 1890,
      postCount: 98,
      subscriptionPriceCents: 999, // $9.99
      avatarUrl: null,
      bannerGradient: 'from-blue-900 via-zinc-900 to-emerald-950',
      isVerified: true,
    },
    {
      id: 'c3',
      handle: 'aria_cyber',
      displayName: 'Aria Takahashi',
      bio: 'Cyberpunk 3D modeling, futuristic cosplay photography, and weekly stream hangouts 👾⚡',
      category: ['cosplay', 'art', 'gaming'],
      subscriberCount: 3120,
      postCount: 210,
      subscriptionPriceCents: 1999, // $19.99
      avatarUrl: null,
      bannerGradient: 'from-rose-900 via-purple-950 to-amber-950',
      isVerified: true,
    },
    {
      id: 'c4',
      handle: 'chloe_noir',
      displayName: 'Chloe Noir',
      bio: 'Dark aesthetic portrait photography, cinematic short films, and exclusive set photo drops 🎬🖤',
      category: ['art', 'lifestyle'],
      subscriberCount: 1420,
      postCount: 76,
      subscriptionPriceCents: 1299, // $12.99
      avatarUrl: null,
      bannerGradient: 'from-zinc-900 via-purple-950 to-zinc-950',
      isVerified: true,
    },
  ];

  const filteredCreators = featuredCreators.filter((c) => {
    const matchesCategory =
      selectedCategory === 'all' || c.category.includes(selectedCategory);
    const matchesSearch =
      !searchQuery.trim() ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bio.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Search Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" /> Explore & Safe Discovery
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Discover Top Independent Creators
          </h1>
          <p className="text-sm text-zinc-400">
            Subscribe directly to verified creators, unlock exclusive PPV drops, and join live broadcasts.
          </p>

          {/* Search Input Bar */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by creator name, @handle, or topic..."
              className="w-full pl-11 pr-4 py-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-xl"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-center flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.slug
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Featured Spotlight Banner */}
        <div className="p-6 bg-gradient-to-r from-purple-950/60 via-zinc-900 to-pink-950/40 border border-purple-500/30 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 z-10 max-w-xl">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-400 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" /> Featured Spotlight
            </span>
            <h2 className="text-2xl font-bold text-white">Elena Valkyrie</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Top trending creator in Cosplay & Music this month with 142 exclusive photosets, acoustic drops, and live studio broadcasts.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link href="/elena_valkyrie">
                <Button variant="primary" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs">
                  View Profile & Subscribe
                </Button>
              </Link>
              <span className="text-xs font-mono text-zinc-400">
                $14.99 / month • 2.4k Subscribers
              </span>
            </div>
          </div>

          <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 p-1 flex-shrink-0 shadow-xl">
            <div className="w-full h-full rounded-xl bg-zinc-950 flex items-center justify-center font-bold text-4xl text-purple-300">
              EV
            </div>
          </div>
        </div>

        {/* Creator Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              {selectedCategory === 'all' ? 'All Verified Creators' : `${categories.find((c) => c.slug === selectedCategory)?.name}`}
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              {filteredCreators.length} creators found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-purple-500/40 transition flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Banner Header */}
                  <div className={`h-24 bg-gradient-to-r ${creator.bannerGradient} relative`}>
                    <div className="absolute -bottom-6 left-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-xl">
                        <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center font-bold text-sm text-purple-300">
                          {creator.displayName.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="pt-8 p-4 space-y-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition">
                          {creator.displayName}
                        </h3>
                        {creator.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">@{creator.handle}</p>
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {creator.bio}
                    </p>

                    {/* Stats & Categories */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-zinc-500" />
                        {creator.subscriberCount.toLocaleString()} subs
                      </span>
                      <span>{creator.postCount} posts</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0">
                  <Link href={`/${creator.handle}`} className="w-full block">
                    <Button
                      variant="secondary"
                      className="w-full text-xs font-semibold hover:bg-purple-600 hover:text-white hover:border-purple-600 transition flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Subscribe ${(creator.subscriptionPriceCents / 100).toFixed(2)}/mo
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
