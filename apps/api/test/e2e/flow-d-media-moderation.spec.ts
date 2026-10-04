import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModerationService } from '../../src/moderation/moderation.service.js';

describe('E2E Flow D: Media Moderation, CSAM Zero-Tolerance & 2257 Performer Consent Inspection', () => {
  let moderationService: ModerationService;

  const mockMedia = new Map<string, any>();
  const mockUsers = new Map<string, any>();
  const mockCases = new Map<string, any>();
  const mockLegalReports: any[] = [];
  const mockAuditLogs: any[] = [];

  const mockPrisma: any = {
    mediaAsset: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockMedia.get(where.id) || null)),
      update: vi.fn(({ where, data }) => {
        const m = mockMedia.get(where.id);
        if (!m) throw new Error('Media not found');
        const updated = { ...m, ...data };
        mockMedia.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    user: {
      update: vi.fn(({ where, data }) => {
        const u = mockUsers.get(where.id);
        if (!u) throw new Error('User not found');
        const updated = { ...u, ...data };
        mockUsers.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    moderationCase: {
      create: vi.fn(({ data }) => {
        const c = { id: `case_${Date.now()}_${Math.random()}`, ...data, createdAt: new Date() };
        mockCases.set(c.id, c);
        return Promise.resolve(c);
      }),
      findMany: vi.fn(({ where }) => {
        const list: any[] = [];
        for (const c of mockCases.values()) {
          if (!where.priority || c.priority === where.priority) list.push(c);
        }
        return Promise.resolve(list);
      }),
    },
    legalReport: {
      create: vi.fn(({ data }) => {
        const rep = { id: `leg_${Date.now()}`, ...data, filedAt: new Date() };
        mockLegalReports.push(rep);
        return Promise.resolve(rep);
      }),
    },
    auditLog: {
      create: vi.fn(({ data }) => {
        mockAuditLogs.push(data);
        return Promise.resolve({ id: `audit_${Date.now()}`, ...data });
      }),
    },
    post: {
      update: vi.fn(() => Promise.resolve({ id: 'post-1' })),
    },
    report: {
      create: vi.fn(() => Promise.resolve({ id: 'report-1' })),
    },
  };

  beforeEach(() => {
    mockMedia.clear();
    mockUsers.clear();
    mockCases.clear();
    mockLegalReports.length = 0;
    mockAuditLogs.length = 0;

    moderationService = new ModerationService(mockPrisma);
  });

  it('executes Flow D1: CSAM hash match -> Immediate Media Purge, User Account Ban & NCMEC Legal Referral', async () => {
    const offendingUserId = 'user-violator-99';
    mockUsers.set(offendingUserId, { id: offendingUserId, status: 'active', role: 'creator' });

    const mediaId = 'media-csam-upload-1';
    mockMedia.set(mediaId, {
      id: mediaId,
      ownerId: offendingUserId,
      status: 'uploaded',
    });

    // Run automated moderation scan
    const modResult = await moderationService.processMediaAutomod(
      mediaId,
      'test_csam_hash_match',
      'pdq_match_known_bad_hash',
      1,
      1,
    );

    expect(modResult.status).toBe('quarantined');
    expect(modResult.csamMatch).toBe(true);

    // Verify media status is rejected
    const media = mockMedia.get(mediaId);
    expect(media.status).toBe('rejected');

    // Verify offender account is suspended/banned
    const user = mockUsers.get(offendingUserId);
    expect(user.status).toBe('suspended');

    // Verify P0 Moderation Case opened
    const cases = Array.from(mockCases.values());
    const p0Case = cases.find((c) => c.priority === 0);
    expect(p0Case).toBeDefined();

    // Verify NCMEC Legal Report created
    expect(mockLegalReports.length).toBeGreaterThan(0);
    expect(mockLegalReports[0].authority).toBe('NCMEC');
  });

  it('executes Flow D2: Multi-Performer Face Mismatch -> Flags P1 Case for 2257 Compliance Officer', async () => {
    const creatorId = 'creator-valid-2';
    mockUsers.set(creatorId, { id: creatorId, status: 'active', role: 'creator' });

    const mediaId = 'media-duo-scene-2';
    mockMedia.set(mediaId, {
      id: mediaId,
      ownerId: creatorId,
      status: 'uploaded',
    });

    // Run moderation scan where 2 faces were detected in frame, but only 1 performer was tagged
    const modResult = await moderationService.processMediaAutomod(
      mediaId,
      'clean_regular_sha256_hash_scene2',
      undefined,
      2, // 2 faces detected
      1, // 1 performer consent attached
    );

    expect(modResult.status).toBe('in_review');
    expect(modResult.csamMatch).toBeFalsy();

    // Verify media status placed in_review
    const media = mockMedia.get(mediaId);
    expect(media.status).toBe('in_review');

    // Verify P1 Moderation Case opened for 2257 compliance inspection
    const cases = Array.from(mockCases.values());
    const p1Case = cases.find((c) => c.priority === 1);
    expect(p1Case).toBeDefined();
    expect(p1Case.source).toBe('classifier');
  });
});
