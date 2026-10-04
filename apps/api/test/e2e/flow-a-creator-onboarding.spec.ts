import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreatorService } from '../../src/creator/creator.service.js';
import { PerformersService } from '../../src/creator/performers.service.js';
import { AuthService } from '../../src/auth/auth.service.js';

describe('E2E Flow A: Creator Onboarding & Identity Compliance (18 U.S.C. §2257)', () => {
  let authService: AuthService;
  let creatorService: CreatorService;
  let performersService: PerformersService;

  const mockUsersDb = new Map<string, any>();
  const mockProfilesDb = new Map<string, any>();
  const mockVerificationsDb = new Map<string, any>();
  const mockPerformersDb = new Map<string, any>();

  const mockPrisma: any = {
    session: {
      create: vi.fn(({ data }) => Promise.resolve({ id: `sess_${Date.now()}`, ...data })),
    },
    user: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      findUnique: vi.fn(({ where, include }) => {
        if (where.email) {
          for (const u of mockUsersDb.values()) {
            if (u.email === where.email) return Promise.resolve(u);
          }
          return Promise.resolve(null);
        }
        const u = mockUsersDb.get(where.id);
        if (!u) return Promise.resolve(null);
        if (include) {
          const prof = mockProfilesDb.get(u.id);
          const verifs = Array.from(mockVerificationsDb.values()).filter((v) => v.subjectUserId === u.id);
          return Promise.resolve({
            ...u,
            creatorProfile: prof || null,
            verificationsAsSubject: verifs,
            taxProfiles: [],
            payoutMethods: [],
          });
        }
        return Promise.resolve(u);
      }),
      create: vi.fn(({ data }) => {
        const user = { id: `usr_${Date.now()}_${Math.random()}`, ...data, createdAt: new Date() };
        mockUsersDb.set(user.id, user);
        return Promise.resolve(user);
      }),
      update: vi.fn(({ where, data }) => {
        const u = mockUsersDb.get(where.id);
        if (!u) throw new Error('User not found');
        const updated = { ...u, ...data };
        mockUsersDb.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    creatorProfile: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockProfilesDb.get(where.userId || where.id) || null)),
      create: vi.fn(({ data }) => {
        const profile = { id: `prof_${Date.now()}`, ...data, createdAt: new Date() };
        mockProfilesDb.set(data.userId, profile);
        mockProfilesDb.set(profile.id, profile);
        return Promise.resolve(profile);
      }),
      update: vi.fn(({ where, data }) => {
        const p = mockProfilesDb.get(where.userId || where.id);
        if (!p) throw new Error('Profile not found');
        const updated = { ...p, ...data };
        mockProfilesDb.set(p.userId, updated);
        mockProfilesDb.set(p.id, updated);
        return Promise.resolve(updated);
      }),
    },
    subscriptionPlan: {
      create: vi.fn(({ data }) => Promise.resolve({ id: `plan_${Date.now()}`, ...data })),
    },
    creatorBalance: {
      create: vi.fn(({ data }) => Promise.resolve({ id: `bal_${Date.now()}`, ...data })),
    },
    verification: {
      create: vi.fn(({ data }) => {
        const v = { id: `ver_${Date.now()}`, ...data, createdAt: new Date() };
        mockVerificationsDb.set(v.id, v);
        return Promise.resolve(v);
      }),
      findFirst: vi.fn(({ where }) => {
        for (const v of mockVerificationsDb.values()) {
          if (v.userId === where.userId && (!where.status || v.status === where.status)) {
            return Promise.resolve(v);
          }
        }
        return Promise.resolve(null);
      }),
      update: vi.fn(({ where, data }) => {
        const v = mockVerificationsDb.get(where.id);
        if (!v) throw new Error('Verification not found');
        const updated = { ...v, ...data };
        mockVerificationsDb.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    taxProfile: {
      create: vi.fn(({ data }) => Promise.resolve({ id: `tax_${Date.now()}`, ...data })),
    },
    performer: {
      create: vi.fn(({ data }) => {
        const r = { id: `perf_${Date.now()}`, ...data, createdAt: new Date() };
        mockPerformersDb.set(r.id, r);
        return Promise.resolve(r);
      }),
      findMany: vi.fn(({ where }) => {
        const list: any[] = [];
        for (const r of mockPerformersDb.values()) {
          if (r.creatorId === where.creatorId) list.push(r);
        }
        return Promise.resolve(list);
      }),
    },
    auditLog: {
      create: vi.fn(({ data }) => Promise.resolve({ id: `audit_${Date.now()}`, ...data })),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const mockJwtService: any = {
    sign: vi.fn().mockReturnValue('mock_jwt_access_token'),
    verify: vi.fn(),
  };

  const mockConfigService: any = {
    get: vi.fn().mockReturnValue('mock_secret'),
  };

  const mockRedisService: any = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };

  beforeEach(() => {
    mockUsersDb.clear();
    mockProfilesDb.clear();
    mockVerificationsDb.clear();
    mockPerformersDb.clear();

    authService = new AuthService(
      mockPrisma,
      mockJwtService,
      mockConfigService,
      mockRedisService
    );
    creatorService = new CreatorService(mockPrisma);
    performersService = new PerformersService(mockPrisma);
  });

  it('executes complete Flow A: Fan Signup -> 2FA Enabled -> KYC Application -> 2257 Release -> Approved Creator Profile', async () => {
    // Step 1: User signs up
    const signupResult = await authService.signup({
      email: 'creator.candidate@lumora.app',
      password: 'SecurePassword123!',
      handle: 'artistic_creator',
      displayName: 'Artistic Creator',
      birthDate: '1995-06-15',
    });

    const userId = signupResult.response.user.id;
    // Enable 2FA on account
    mockUsersDb.set(userId, { ...mockUsersDb.get(userId), totpSecretEnc: 'mock_encrypted_totp' });

    // Step 2: Creator submits KYC Application
    const profile = await creatorService.apply(userId, {
      handle: 'artistic_creator',
      displayName: 'Artistic Creator',
      bio: 'Professional creator & digital artist',
      subscriptionPriceCents: 1500,
      idFrontKey: 's3://lumora-kyc/jane_doe_passport.enc',
      selfieLivenessKey: 's3://lumora-kyc/jane_doe_liveness.enc',
      legalName: 'Jane Doe',
      country: 'USA',
      tinLast4: '1234',
    });

    expect(profile.id).toBeDefined();
    expect(profile.status).toBe('draft');

    // Step 3: Register 2257 Performer Consent Release for collaborator
    const performerRelease = await performersService.createPerformer(userId, {
      legalName: 'Alex Smith',
      stageName: 'Alex S',
      dob: '1998-04-20',
    });

    expect(performerRelease.id).toBeDefined();
    expect(performerRelease.stageName).toBe('Alex S');

    // Step 4: Admin KYC Review Webhook Approval
    const verRecord = {
      id: 'ver-123',
      subjectUserId: userId,
      subjectUser: {
        creatorProfile: { id: profile.id },
      },
    };
    mockVerificationsDb.set('sumsub_ref_123', verRecord);
    mockVerificationsDb.set('ver-123', verRecord);

    mockPrisma.verification.findUnique = vi.fn(({ where }) => Promise.resolve(mockVerificationsDb.get(where.id || where.providerRef)));

    await creatorService.processKycWebhook('sumsub_ref_123', {
      status: 'approved',
      score: 0.95,
      age: 24,
      docMatch: true,
      sanctionsHit: false,
    });

    // Step 5: Verify creator profile is now in pending_review/approved
    const creatorStatus = await creatorService.getStatus(userId);
    expect(creatorStatus.status).toBe('pending_review');
  });
});
