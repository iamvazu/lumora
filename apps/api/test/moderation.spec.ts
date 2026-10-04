import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModerationService } from '../src/moderation/moderation.service.js';

describe('ModerationService (E5 Moderation Pipeline)', () => {
  let service: ModerationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      mediaAsset: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: 'media-1', status: 'rejected' }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: 'creator-1', status: 'suspended' }),
      },
      moderationCase: {
        create: vi.fn().mockResolvedValue({ id: 'case-p0-1', priority: 0, status: 'actioned' }),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn().mockResolvedValue({ id: 'case-p0-1', status: 'actioned' }),
      },
      legalReport: {
        create: vi.fn().mockResolvedValue({ id: 'legal-1', authority: 'NCMEC' }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      report: {
        create: vi.fn().mockResolvedValue({ id: 'report-1' }),
      },
      post: {
        update: vi.fn().mockResolvedValue({ id: 'post-1' }),
      },
    };

    service = new ModerationService(mockPrisma);
  });

  it('quarantines media, freezes creator, and files NCMEC report on CSAM match', async () => {
    mockPrisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'media-csam-1',
      ownerId: 'creator-bad',
      status: 'uploaded',
    });

    const result = await service.processMediaAutomod(
      'media-csam-1',
      'test_csam_hash_match',
      undefined,
      1,
      1,
    );

    expect(result.status).toBe('quarantined');
    expect(result.csamMatch).toBe(true);
    expect(mockPrisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'media-csam-1' },
      data: { status: 'rejected' },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'creator-bad' },
      data: { status: 'suspended' },
    });
    expect(mockPrisma.legalReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ authority: 'NCMEC' }),
    });
  });

  it('queues media for P1 human review when detected faces > verified performers (Story E5-4)', async () => {
    mockPrisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'media-duo-1',
      ownerId: 'creator-good',
      status: 'uploaded',
    });

    mockPrisma.moderationCase.create.mockResolvedValue({
      id: 'case-p1-faces',
      priority: 1,
      status: 'open',
    });

    const result = await service.processMediaAutomod(
      'media-duo-1',
      'clean_sha256_hash_123',
      undefined,
      2, // 2 detected faces
      1, // only 1 verified performer
    );

    expect(result.status).toBe('in_review');
    expect(result.reason).toBe('performer_mismatch');
    expect(mockPrisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'media-duo-1' },
      data: { status: 'in_review' },
    });
  });

  it('auto-approves clean media when performer counts match', async () => {
    mockPrisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'media-clean-1',
      ownerId: 'creator-good',
      status: 'uploaded',
    });

    const result = await service.processMediaAutomod(
      'media-clean-1',
      'clean_sha256_hash_abc',
      undefined,
      1,
      1,
    );

    expect(result.status).toBe('approved');
    expect(result.csamMatch).toBe(false);
    expect(mockPrisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'media-clean-1' },
      data: { status: 'approved' },
    });
  });

  it('allows moderator to action case and records audit log', async () => {
    mockPrisma.moderationCase.findUnique.mockResolvedValue({
      id: 'case-123',
      targetType: 'media',
      targetId: 'media-target-1',
      status: 'open',
    });

    await service.actionCase('mod-user-1', 'case-123', {
      action: 'approve',
      reason: 'Verified performer credentials provided',
    });

    expect(mockPrisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'media-target-1' },
      data: { status: 'approved' },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'mod-user-1',
        action: 'moderation_approve',
      }),
    });
  });

  it('supports moderator welfare preferences (blur & session limits)', () => {
    const prefs = service.getWelfarePreferences('mod-1');
    expect(prefs.blurByDefault).toBe(true);
    expect(prefs.grayscaleMode).toBe(true);

    const updated = service.updateWelfarePreferences('mod-1', {
      blurByDefault: false,
      grayscaleMode: true,
      maxSessionMinutes: 45,
      breakReminderMinutes: 20,
    });
    expect(updated.maxSessionMinutes).toBe(45);
    expect(service.getWelfarePreferences('mod-1').blurByDefault).toBe(false);
  });
});
