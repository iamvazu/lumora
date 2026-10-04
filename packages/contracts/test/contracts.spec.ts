import { describe, it, expect } from 'vitest';
import {
  SignUpRequestSchema,
  LoginRequestSchema,
  ProblemDetailsSchema,
  CursorPaginationQuerySchema,
  CreatePostRequestSchema,
} from '../src/index.js';

describe('Contracts Schema Validation', () => {
  it('validates a valid signup request', () => {
    const valid = {
      email: 'creator@lumora.app',
      password: 'SecurePassword123!',
      handle: 'valid_handle',
      displayName: 'Creator One',
      role: 'creator',
      country: 'US',
    };
    const result = SignUpRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid handle format', () => {
    const invalid = {
      email: 'creator@lumora.app',
      password: 'SecurePassword123!',
      handle: 'invalid handle with spaces',
      displayName: 'Creator One',
    };
    const result = SignUpRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates RFC 9457 Problem Details', () => {
    const problem = {
      type: 'https://lumora.app/errors/400',
      title: 'Validation Error',
      status: 400,
      code: 'VALIDATION_ERROR',
      detail: 'Invalid input parameters provided',
      requestId: 'req-1234-uuid',
    };
    const result = ProblemDetailsSchema.safeParse(problem);
    expect(result.success).toBe(true);
  });

  it('handles cursor pagination query limits', () => {
    const valid = CursorPaginationQuerySchema.safeParse({ limit: 50 });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.limit).toBe(50);
    }

    const overLimit = CursorPaginationQuerySchema.safeParse({ limit: 100 });
    expect(overLimit.success).toBe(false);
  });

  it('validates post creation payload', () => {
    const post = {
      body: 'Check out my latest post!',
      visibility: 'subscribers',
      mediaIds: ['11111111-1111-7111-8111-111111111111'],
    };
    const result = CreatePostRequestSchema.safeParse(post);
    expect(result.success).toBe(true);
  });
});
