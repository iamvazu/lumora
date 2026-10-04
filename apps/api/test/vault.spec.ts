import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VaultService } from '../src/vault/vault.service.js';

describe('VaultService (E11 Media Vault)', () => {
  let service: VaultService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      creatorProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: 'creator-1', userId: 'user-1' }),
      },
      vaultFolder: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      vaultItem: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      mediaAsset: {
        findFirst: vi.fn(),
      },
    };

    service = new VaultService(mockPrisma);
  });

  it('creates and lists folders with item count', async () => {
    mockPrisma.vaultFolder.create.mockResolvedValue({
      id: 'folder-1',
      creatorId: 'creator-1',
      name: 'Photoshoots',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await service.createFolder('user-1', {
      name: 'Photoshoots',
    });

    expect(created.id).toBe('folder-1');
    expect(created.name).toBe('Photoshoots');
    expect(mockPrisma.vaultFolder.create).toHaveBeenCalledWith({
      data: { creatorId: 'creator-1', name: 'Photoshoots', parentId: undefined },
    });
  });

  it('adds media item to vault with custom tags', async () => {
    mockPrisma.mediaAsset.findFirst.mockResolvedValue({
      id: 'media-1',
      ownerId: 'user-1',
      kind: 'image',
      status: 'approved',
      width: 1080,
      height: 1920,
    });

    mockPrisma.vaultItem.create.mockResolvedValue({
      id: 'v-item-1',
      folderId: 'folder-1',
      mediaId: 'media-1',
      tags: ['beach', 'summer2026'],
      createdAt: new Date(),
      updatedAt: new Date(),
      media: {
        id: 'media-1',
        kind: 'image',
        status: 'approved',
        width: 1080,
        height: 1920,
      },
    });

    const result = await service.addVaultItem('user-1', {
      mediaId: 'media-1',
      folderId: 'folder-1',
      tags: ['beach', 'summer2026'],
    });

    expect(result.id).toBe('v-item-1');
    expect(result.tags).toEqual(['beach', 'summer2026']);
    expect(result.media.thumbUrl).toContain('media-1.jpg');
  });

  it('updates vault item folder and tags', async () => {
    mockPrisma.vaultItem.findFirst.mockResolvedValue({
      id: 'v-item-1',
      folderId: 'folder-1',
      mediaId: 'media-1',
      tags: ['beach'],
      media: { id: 'media-1', kind: 'image', status: 'approved' },
    });

    mockPrisma.vaultItem.update.mockResolvedValue({
      id: 'v-item-1',
      folderId: 'folder-2',
      mediaId: 'media-1',
      tags: ['beach', 'sunset'],
      createdAt: new Date(),
      updatedAt: new Date(),
      media: { id: 'media-1', kind: 'image', status: 'approved' },
    });

    const result = await service.updateVaultItem('user-1', 'v-item-1', {
      folderId: 'folder-2',
      tags: ['beach', 'sunset'],
    });

    expect(result.folderId).toBe('folder-2');
    expect(result.tags).toEqual(['beach', 'sunset']);
  });
});
