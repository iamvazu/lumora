import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../src/auth/auth.service.js';

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockRedisService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      session: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock_jwt_access_token'),
      verify: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockReturnValue('mock_secret'),
    };

    mockRedisService = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    authService = new AuthService(
      mockPrisma,
      mockJwtService,
      mockConfigService,
      mockRedisService
    );
  });

  it('signs up a new user and returns tokens', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: '11111111-1111-7111-8111-111111111111',
      email: 'creator@lumora.app',
      handle: 'lumorafan',
      displayName: 'Lumora Fan',
      role: 'fan',
      status: 'active',
      avatarMediaId: null,
      emailVerifiedAt: null,
      ageVerifiedAt: null,
      totpSecretEnc: null,
    });
    mockPrisma.session.create.mockResolvedValue({ id: 'sess-1' });

    const result = await authService.signup({
      email: 'creator@lumora.app',
      password: 'SecurePassword123!',
      handle: 'lumorafan',
      displayName: 'Lumora Fan',
      role: 'fan',
      country: 'US',
    });

    expect(result.response.accessToken).toBe('mock_jwt_access_token');
    expect(result.response.user.email).toBe('creator@lumora.app');
    expect(result.response.user.handle).toBe('lumorafan');
    expect(result.refreshToken).toBeDefined();
  });

  it('rejects duplicate email during signup', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'existing-id',
      email: 'existing@lumora.app',
      handle: 'existinghandle',
    });

    await expect(
      authService.signup({
        email: 'existing@lumora.app',
        password: 'SecurePassword123!',
        handle: 'newhandle',
        displayName: 'New User',
        role: 'fan',
        country: 'US',
      })
    ).rejects.toThrow();
  });
});
