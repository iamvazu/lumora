'use client';

import React, { useState } from 'react';
import { Card, Button, Input } from '@lumora/ui';
import {
  Folder,
  FolderPlus,
  Video,
  UploadCloud,
  MoreVertical,
  Search,
} from 'lucide-react';
import type { VaultFolderDto, VaultItemDto } from '@lumora/contracts';

const SAMPLE_FOLDERS: VaultFolderDto[] = [
  {
    id: 'f-1',
    creatorId: 'c-1',
    name: 'Photoshoots 2026',
    parentId: null,
    itemCount: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f-2',
    creatorId: 'c-1',
    name: 'Behind the Scenes Videos',
    parentId: null,
    itemCount: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f-3',
    creatorId: 'c-1',
    name: 'PPV Exclusive Sets',
    parentId: null,
    itemCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SAMPLE_ITEMS: VaultItemDto[] = [
  {
    id: 'v-1',
    folderId: 'f-1',
    mediaId: 'm-1',
    tags: ['glamour', 'studio', 'summer'],
    media: {
      id: 'm-1',
      kind: 'image',
      status: 'approved',
      width: 1080,
      height: 1920,
      thumbUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      isEntitled: true,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'v-2',
    folderId: 'f-2',
    mediaId: 'm-2',
    tags: ['bts', 'rehearsal'],
    media: {
      id: 'm-2',
      kind: 'video',
      status: 'approved',
      width: 1920,
      height: 1080,
      durationMs: 45000,
      thumbUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
      isEntitled: true,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'v-3',
    folderId: 'f-3',
    mediaId: 'm-3',
    tags: ['ppv', '4k'],
    media: {
      id: 'm-3',
      kind: 'image',
      status: 'approved',
      width: 3840,
      height: 2160,
      thumbUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
      isEntitled: true,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function MediaVaultPage() {
  const [folders, setFolders] = useState<VaultFolderDto[]>(SAMPLE_FOLDERS);
  const [items, setItems] = useState<VaultItemDto[]>(SAMPLE_ITEMS);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: VaultFolderDto = {
      id: `f-${Date.now()}`,
      creatorId: 'c-1',
      name: newFolderName.trim(),
      parentId: null,
      itemCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFolders((prev) => [...prev, newFolder]);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleUploadSample = () => {
    const newMediaId = `m-${Date.now()}`;
    const newItem: VaultItemDto = {
      id: `v-${Date.now()}`,
      folderId: activeFolderId,
      mediaId: newMediaId,
      tags: ['new_upload'],
      media: {
        id: newMediaId,
        kind: 'image',
        status: 'approved',
        width: 1080,
        height: 1920,
        thumbUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
        isEntitled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);
  };

  const filteredItems = items.filter((item) => {
    if (activeFolderId && item.folderId !== activeFolderId) return false;
    if (searchQuery) {
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchTag;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-purple-400" />
            Creator Media Vault
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Encrypted asset storage with folder organization and multi-post reuse
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>

          <Button
            variant="primary"
            onClick={handleUploadSample}
            className="flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Folders Navigation */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 space-y-2 border-zinc-800 bg-zinc-900/60 rounded-2xl">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2">
              Folders
            </div>

            <button
              onClick={() => setActiveFolderId(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeFolderId === null
                  ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-purple-400" />
                <span>All Media</span>
              </div>
              <span className="text-[11px] text-zinc-500">{items.length}</span>
            </button>

            {folders.map((f) => {
              const isSelected = activeFolderId === f.id;
              const count = items.filter((i) => i.folderId === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFolderId(f.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">{count}</span>
                </button>
              );
            })}
          </Card>
        </div>

        {/* Right Column: Media Grid */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by tag (#glamour, #bts)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="text-xs text-zinc-500">
              Showing {filteredItems.length} items
            </div>
          </div>

          {/* Media Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="group relative rounded-2xl overflow-hidden border-zinc-800 bg-zinc-900/40 hover:border-purple-500/50 transition-all shadow-md"
              >
                <div className="relative aspect-[3/4] w-full bg-zinc-950 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundImage: `url(${item.media.thumbUrl})` }}
                  />

                  {item.media.kind === 'video' && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1 font-mono">
                      <Video className="w-3 h-3 text-purple-400" />
                      45s
                    </div>
                  )}

                  {/* Actions Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button className="p-1 rounded bg-black/50 text-zinc-300 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950/80 text-purple-200 border border-purple-700/50 font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <Button size="sm" variant="primary" className="w-full text-xs py-1.5">
                        Use in Post
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 border-zinc-800 bg-zinc-900 rounded-3xl shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-purple-400" />
              Create New Vault Folder
            </h3>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <Input
                label="Folder Name"
                placeholder="e.g. Exclusive 2026 Sets"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewFolderModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Folder
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
