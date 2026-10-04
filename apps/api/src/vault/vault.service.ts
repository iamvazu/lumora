import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateVaultFolderRequest,
  AddVaultItemRequest,
  UpdateVaultItemRequest,
  VaultFolderDto,
  VaultItemDto,
  ProblemException,
} from '@lumora/contracts';

@Injectable()
export class VaultService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCreatorId(userId: string): Promise<string> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });
    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Vault is only accessible to creators.',
        requestId: '',
      });
    }
    return creator.id;
  }

  /**
   * Get all folders for creator
   */
  async getFolders(userId: string): Promise<VaultFolderDto[]> {
    const creatorId = await this.getCreatorId(userId);

    const folders = await this.prisma.vaultFolder.findMany({
      where: { creatorId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return folders.map((f) => ({
      id: f.id,
      creatorId: f.creatorId,
      name: f.name,
      parentId: f.parentId,
      itemCount: f._count.items,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));
  }

  /**
   * Create a folder
   */
  async createFolder(userId: string, dto: CreateVaultFolderRequest): Promise<VaultFolderDto> {
    const creatorId = await this.getCreatorId(userId);

    const folder = await this.prisma.vaultFolder.create({
      data: {
        creatorId,
        name: dto.name,
        parentId: dto.parentId,
      },
    });

    return {
      id: folder.id,
      creatorId: folder.creatorId,
      name: folder.name,
      parentId: folder.parentId,
      itemCount: 0,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }

  /**
   * Delete folder
   */
  async deleteFolder(userId: string, folderId: string) {
    const creatorId = await this.getCreatorId(userId);

    const folder = await this.prisma.vaultFolder.findFirst({
      where: { id: folderId, creatorId },
    });

    if (!folder) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Folder Not Found',
        detail: `Folder ${folderId} does not exist.`,
        requestId: '',
      });
    }

    await this.prisma.vaultFolder.delete({
      where: { id: folderId },
    });

    return { success: true };
  }

  /**
   * Get vault items
   */
  async getVaultItems(userId: string, folderId?: string, tag?: string): Promise<VaultItemDto[]> {
    await this.getCreatorId(userId);

    const where: any = {
      media: { ownerId: userId },
    };

    if (folderId !== undefined) {
      where.folderId = folderId === 'null' ? null : folderId;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const items = await this.prisma.vaultItem.findMany({
      where,
      include: { media: true },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      folderId: item.folderId,
      mediaId: item.mediaId,
      tags: item.tags,
      media: {
        id: item.media.id,
        kind: item.media.kind as any,
        status: item.media.status as any,
        width: item.media.width,
        height: item.media.height,
        durationMs: item.media.durationMs,
        thumbUrl: `https://media.lumora.app/thumb/${item.media.id}.jpg`,
        blurredUrl: `https://media.lumora.app/blurred/${item.media.id}.jpg`,
        playbackUrl: `https://media.lumora.app/stream/${item.media.id}/master.m3u8`,
        isEntitled: true,
      },
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  /**
   * Add item to vault
   */
  async addVaultItem(userId: string, dto: AddVaultItemRequest): Promise<VaultItemDto> {
    await this.getCreatorId(userId);

    const media = await this.prisma.mediaAsset.findFirst({
      where: { id: dto.mediaId, ownerId: userId },
    });

    if (!media) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Media Not Found',
        detail: `Media ${dto.mediaId} does not belong to you or does not exist.`,
        requestId: '',
      });
    }

    const item = await this.prisma.vaultItem.create({
      data: {
        mediaId: dto.mediaId,
        folderId: dto.folderId,
        tags: dto.tags || [],
      },
      include: { media: true },
    });

    return {
      id: item.id,
      folderId: item.folderId,
      mediaId: item.mediaId,
      tags: item.tags,
      media: {
        id: item.media.id,
        kind: item.media.kind as any,
        status: item.media.status as any,
        width: item.media.width,
        height: item.media.height,
        durationMs: item.media.durationMs,
        thumbUrl: `https://media.lumora.app/thumb/${item.media.id}.jpg`,
        blurredUrl: `https://media.lumora.app/blurred/${item.media.id}.jpg`,
        playbackUrl: `https://media.lumora.app/stream/${item.media.id}/master.m3u8`,
        isEntitled: true,
      },
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  /**
   * Update vault item tags or folder
   */
  async updateVaultItem(userId: string, itemId: string, dto: UpdateVaultItemRequest): Promise<VaultItemDto> {
    const item = await this.prisma.vaultItem.findFirst({
      where: { id: itemId, media: { ownerId: userId } },
      include: { media: true },
    });

    if (!item) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Vault Item Not Found',
        detail: `Item ${itemId} not found in your vault.`,
        requestId: '',
      });
    }

    const updated = await this.prisma.vaultItem.update({
      where: { id: itemId },
      data: {
        folderId: dto.folderId !== undefined ? dto.folderId : item.folderId,
        tags: dto.tags !== undefined ? dto.tags : item.tags,
      },
      include: { media: true },
    });

    return {
      id: updated.id,
      folderId: updated.folderId,
      mediaId: updated.mediaId,
      tags: updated.tags,
      media: {
        id: updated.media.id,
        kind: updated.media.kind as any,
        status: updated.media.status as any,
        width: updated.media.width,
        height: updated.media.height,
        durationMs: updated.media.durationMs,
        thumbUrl: `https://media.lumora.app/thumb/${updated.media.id}.jpg`,
        blurredUrl: `https://media.lumora.app/blurred/${updated.media.id}.jpg`,
        playbackUrl: `https://media.lumora.app/stream/${updated.media.id}/master.m3u8`,
        isEntitled: true,
      },
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Delete item from vault
   */
  async deleteVaultItem(userId: string, itemId: string) {
    const item = await this.prisma.vaultItem.findFirst({
      where: { id: itemId, media: { ownerId: userId } },
    });

    if (!item) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Vault Item Not Found',
        detail: `Item ${itemId} not found.`,
        requestId: '',
      });
    }

    await this.prisma.vaultItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }
}
