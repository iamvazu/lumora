import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreatorService } from '../src/creator/creator.service.js';
import { PerformersService } from '../src/creator/performers.service.js';

describe('Creator Onboarding & KYC Webhook Pipeline (Story E3-1)', () => {
  let creatorService: CreatorService;
  let performersService: PerformersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      creatorProfile: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      subscriptionPlan: {
        create: vi.fn(),
      },
      creatorBalance: {
        create: vi.fn(),
      },
      verification: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      taxProfile: {
        create: vi.fn(),
      },
      performer: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        if (typeof cb === 'function') {
          return cb(mockPrisma);
        }
        return cb;
      }),
    };

    creatorService = new CreatorService(mockPrisma);
    performersService = new PerformersService(mockPrisma);
  });

  it('rejects creator application if 2FA is not enabled', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-no-2fa',
      totpSecretEnc: null,
    });

    await expect(
      creatorService.apply('user-no-2fa', {
        category: ['Cosplay'],
        isPaid: true,
        subscriptionPriceCents: 999,
        currency: 'USD',
      })
    ).rejects.toThrow(/Two-factor authentication/);
  });

  it('creates draft creator profile with default plan and balance row when 2FA is active', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-with-2fa',
      handle: 'topcreator',
      totpSecretEnc: Buffer.from('secret'),
      creatorProfile: null,
    });

    mockPrisma.creatorProfile.create.mockResolvedValue({
      id: 'creator-1',
      userId: 'user-with-2fa',
      status: 'draft',
    });

    const result = await creatorService.apply('user-with-2fa', {
      category: ['Cosplay'],
      isPaid: true,
      subscriptionPriceCents: 999,
      currency: 'USD',
    });

    expect(result.status).toBe('draft');
  });

  it('Story E3-1: Rejects applicant on KYC webhook when age < 18 or doc mismatch occurs', async () => {
    mockPrisma.verification.findFirst.mockResolvedValue({
      id: 'verif-1',
      subjectUserId: 'user-underage',
      subjectUser: {
        creatorProfile: { id: 'creator-underage' },
      },
    });

    const result = await creatorService.processKycWebhook('vendor_ref_123', {
      status: 'rejected',
      score: 0.4,
      age: 17, // Underage
      docMatch: false,
      sanctionsHit: false,
    });

    expect(result.status).toBe('rejected');
    expect(mockPrisma.creatorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'rejected' },
      })
    );
  });

  it('Story E3-1: Auto-approves applicant on KYC webhook when vendor confidence >= 0.85 and age >= 18', async () => {
    mockPrisma.verification.findFirst.mockResolvedValue({
      id: 'verif-2',
      subjectUserId: 'user-valid',
      subjectUser: {
        creatorProfile: { id: 'creator-valid' },
      },
    });

    const result = await creatorService.processKycWebhook('vendor_ref_valid', {
      status: 'approved',
      score: 0.95,
      age: 24,
      docMatch: true,
      sanctionsHit: false,
    });

    expect(result.status).toBe('approved');
    expect(mockPrisma.creatorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'pending_review' },
      })
    );
  });

  it('adds and lists co-performers for 18 U.S.C. §2257 compliance', async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ id: 'creator-1', userId: 'u1' });
    mockPrisma.performer.create.mockResolvedValue({
      id: 'perf-1',
      stageName: 'Jane Performer',
      status: 'pending',
      createdAt: new Date(),
    });

    const performer = await performersService.createPerformer('u1', {
      legalName: 'Jane Doe',
      stageName: 'Jane Performer',
      dob: '2000-01-01',
    });

    expect(performer.id).toBe('perf-1');
    expect(performer.stageName).toBe('Jane Performer');
  });
});
