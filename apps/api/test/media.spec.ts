import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaService } from '../src/media/media.service.js';

describe('Media Upload & Playback Pipeline (Story E4-2)', () => {
  let mediaService: MediaService;
  let mockPrisma: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      mediaAsset: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      entitlement: {
        findFirst: vi.fn(),
      },
    };

    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'S3_ENDPOINT') return 'http://localhost:9000';
        if (key === 'S3_BUCKET_RAW') return 'uploads-raw';
        if (key === 'S3_BUCKET_PROCESSED') return 'media-processed';
        return null;
      }),
    };

    mediaService = new MediaService(mockPrisma, mockConfig);
  });

  it('rejects uploads exceeding size limit', async () => {
    await expect(
      mediaService.createUploadUrl('user-1', {
        filename: 'huge_image.png',
        mime: 'image/png',
        bytes: 60 * 1024 * 1024, // 60MB > 50MB limit
        kind: 'image',
      })
    ).rejects.toThrow(/File size exceeds the maximum limit/);
  });

  it('creates presigned S3 upload URL for valid media', async () => {
    mockPrisma.mediaAsset.create.mockResolvedValue({});

    const result = await mediaService.createUploadUrl('user-1', {
      filename: 'sample_video.mp4',
      mime: 'video/mp4',
      bytes: 500 * 1024 * 1024, // 500MB
      kind: 'video',
    });

    expect(result.mediaId).toBeDefined();
    expect(result.uploadUrl).toContain('http://localhost:9000/uploads-raw/raw/user-1');
  });

  it('completes upload and marks assets approved with HLS and preview renditions', async () => {
    mockPrisma.mediaAsset.findFirst.mockResolvedValue({
      id: 'media-1',
      ownerId: 'user-1',
      kind: 'video',
    });

    mockPrisma.mediaAsset.update.mockResolvedValue({
      id: 'media-1',
      kind: 'video',
      status: 'approved',
      thumbKey: 'processed/user-1/media-1/thumb.webp',
      blurredKey: 'public/previews/media-1_blurred.webp',
    });

    const result = await mediaService.completeUpload('user-1', 'media-1');
    expect(result.status).toBe('approved');
    expect(result.thumbUrl).toContain('thumb.webp');
  });

  it('blocks unentitled fans from generating playback URLs', async () => {
    mockPrisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'media-locked',
      ownerId: 'creator-1',
      kind: 'video',
      status: 'approved',
      hlsKey: 'processed/creator-1/media-locked/master.m3u8',
    });

    mockPrisma.entitlement.findFirst.mockResolvedValue(null); // Fan is NOT entitled

    await expect(
      mediaService.getPlaybackUrl('fan-unentitled', 'media-locked')
    ).rejects.toThrow(/You must subscribe or purchase/);
  });

  it('allows entitled fans or the uploader to receive playback URL with signed token', async () => {
    mockPrisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'media-unlocked',
      ownerId: 'creator-1',
      kind: 'video',
      status: 'approved',
      hlsKey: 'processed/creator-1/media-unlocked/master.m3u8',
    });

    mockPrisma.entitlement.findFirst.mockResolvedValue({ id: 'entitlement-1' }); // Entitled

    const result = await mediaService.getPlaybackUrl('fan-entitled', 'media-unlocked');
    expect(result.playbackUrl).toContain('http://localhost:9000/media-processed');
    expect(result.playbackUrl).toContain('token=signed_');
    expect(result.watermarkOverlay).toBeDefined();
  });
});
