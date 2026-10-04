import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgeService } from '../src/age/age.service.js';

describe('AgeService & Regional Rules Engine (Unit)', () => {
  let ageService: AgeService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      verification: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma)),
    };

    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
    };

    ageService = new AgeService(mockPrisma, mockRedis);
  });

  it('enforces strict id_liveness for UK, France, and specific US states (TX, VA, UT, LA)', () => {
    expect(ageService.getRequiredMethod('GB').requiredMethod).toBe('id_liveness');
    expect(ageService.getRequiredMethod('FR').requiredMethod).toBe('id_liveness');
    expect(ageService.getRequiredMethod('US', 'TX').requiredMethod).toBe('id_liveness');
    expect(ageService.getRequiredMethod('US', 'VA').requiredMethod).toBe('id_liveness');
  });

  it('defaults to facial_estimation for non-regulated regions', () => {
    expect(ageService.getRequiredMethod('DE').requiredMethod).toBe('facial_estimation');
    expect(ageService.getRequiredMethod('US', 'CA').requiredMethod).toBe('facial_estimation');
  });

  it('creates an age verification session and returns vendor token', async () => {
    mockPrisma.verification.create.mockResolvedValue({
      id: 'av-sess-1',
      providerRef: 'av_token_123',
      type: 'id_liveness',
      status: 'pending',
    });

    const session = await ageService.createSession('user-1', 'GB');
    expect(session.sessionId).toBe('av-sess-1');
    expect(session.requiredMethod).toBe('id_liveness');
    expect(session.verificationUrl).toContain('https://verify.lumora.app');
  });

  it('rejects underage users on webhook completion', async () => {
    mockPrisma.verification.findUnique.mockResolvedValue({
      id: 'av-sess-2',
      subjectUserId: 'user-2',
    });

    await expect(
      ageService.completeVerification('av-sess-2', false, 17)
    ).rejects.toThrow(/must be at least 18 years old/);
  });
});
