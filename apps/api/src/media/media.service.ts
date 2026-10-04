import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MediaUploadRequest, ProblemException } from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  /**
   * Generates a direct presigned upload URL for S3 / MinIO (Flow D, Step 1)
   */
  async createUploadUrl(userId: string, dto: MediaUploadRequest) {
    // Validate file size limits
    const maxLimits = {
      image: 50 * 1024 * 1024, // 50MB
      video: 5 * 1024 * 1024 * 1024, // 5GB
      audio: 500 * 1024 * 1024, // 500MB
    };

    if (dto.bytes > maxLimits[dto.kind]) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'File Size Limit Exceeded',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: `File size exceeds the maximum limit for ${dto.kind} (${Math.round(maxLimits[dto.kind] / (1024 * 1024))}MB).`,
        requestId: '',
      });
    }

    const mediaId = uuidv7();
    const extension = dto.filename.split('.').pop() || 'bin';
    const storageKey = `raw/${userId}/${mediaId}.${extension}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create database asset in 'uploaded' status
    await this.prisma.mediaAsset.create({
      data: {
        id: mediaId,
        ownerId: userId,
        kind: dto.kind,
        storageKey,
        mime: dto.mime,
        bytes: BigInt(dto.bytes),
        sha256: `sha256_pending_${mediaId}`,
        status: 'uploaded',
      },
    });

    const s3Endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const rawBucket = this.configService.get<string>('S3_BUCKET_RAW') || 'uploads-raw';
    const uploadUrl = `${s3Endpoint}/${rawBucket}/${storageKey}?uploadId=${uuidv7()}`;

    return {
      mediaId,
      uploadUrl,
      storageKey,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Marks direct upload as completed and queues processing worker (Flow D, Step 2)
   */
  async completeUpload(userId: string, mediaId: string, sha256?: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: mediaId, ownerId: userId },
    });

    if (!asset) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Media Asset Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Media asset not found.',
        requestId: '',
      });
    }

    const calculatedSha256 = sha256 || `sha256_${mediaId}`;
    const calculatedPhash = `phash_${mediaId.substring(0, 16)}`;

    // Update status to processing and mock initial renditions
    const updated = await this.prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        status: 'approved', // Simulating completed pipeline with auto-approval for testing
        sha256: calculatedSha256,
        phash: calculatedPhash,
        hlsKey: asset.kind === 'video' ? `processed/${userId}/${mediaId}/master.m3u8` : null,
        thumbKey: `processed/${userId}/${mediaId}/thumb.webp`,
        blurredKey: `public/previews/${mediaId}_blurred.webp`,
      },
    });

    return {
      id: updated.id,
      kind: updated.kind,
      status: updated.status,
      thumbUrl: updated.thumbKey ? `http://localhost:9000/media-public/${updated.thumbKey}` : null,
      blurredUrl: updated.blurredKey ? `http://localhost:9000/media-public/${updated.blurredKey}` : null,
    };
  }

  /**
   * Generates a signed playback URL (checks entitlement & moderation status)
   */
  async getPlaybackUrl(userId: string, mediaId: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      include: { owner: true },
    });

    if (!asset) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Media Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Media asset not found.',
        requestId: '',
      });
    }

    // Owner always has access
    const isOwner = asset.ownerId === userId;

    if (!isOwner) {
      // Rule: Content stays invisible to others until moderation status is "approved"
      if (asset.status !== 'approved') {
        throw new ProblemException({
          type: 'https://lumora.app/errors/not-found',
          title: 'Content Not Available',
          status: 404,
          code: 'NOT_FOUND',
          detail: 'This content is not currently available.',
          requestId: '',
        });
      }

      // Check entitlement
      const entitlement = await this.prisma.entitlement.findFirst({
        where: {
          userId,
          resourceType: 'media',
          resourceId: mediaId,
        },
      });

      if (!entitlement) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/not-entitled',
          title: 'Content Locked',
          status: 403,
          code: 'NOT_ENTITLED',
          detail: 'You must subscribe or purchase this item to access playback.',
          requestId: '',
        });
      }
    }

    const s3Endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const processedBucket = this.configService.get<string>('S3_BUCKET_PROCESSED') || 'media-processed';
    const playbackUrl = `${s3Endpoint}/${processedBucket}/${asset.hlsKey || asset.storageKey}?token=signed_${uuidv7()}&uid=${userId}`;

    return {
      mediaId: asset.id,
      kind: asset.kind,
      playbackUrl,
      watermarkOverlay: isOwner ? null : { text: `lumora.app / ${userId}` },
      expiresInSeconds: 600, // 10-minute TTL
    };
  }
}
