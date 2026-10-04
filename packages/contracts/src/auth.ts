import { z } from 'zod';

export const UserRoleEnum = z.enum(['fan', 'creator', 'agency', 'staff', 'admin']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserStatusEnum = z.enum(['active', 'suspended', 'banned', 'deleted']);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const SignUpRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be under 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain alphanumeric characters and underscores')
    .toLowerCase(),
  displayName: z.string().min(1).max(50),
  role: UserRoleEnum.default('fan'),
  country: z.string().length(2).toUpperCase().default('US'),
});
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;

export const LoginRequestSchema = z.object({
  emailOrHandle: z.string().min(1),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthTokenResponseSchema = z.object({
  accessToken: z.string(),
  expiresInSeconds: z.number().int(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    handle: z.string(),
    displayName: z.string(),
    role: UserRoleEnum,
    status: UserStatusEnum,
    avatarMediaId: z.string().uuid().nullable(),
    isEmailVerified: z.boolean(),
    isAgeVerified: z.boolean(),
    is2FAEnabled: z.boolean(),
  }),
  requires2FA: z.boolean().optional(),
});
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;

export const Setup2FAResponseSchema = z.object({
  secret: z.string(),
  otpAuthUrl: z.string(),
  qrCodeDataUrl: z.string(),
  backupCodes: z.array(z.string()),
});
export type Setup2FAResponse = z.infer<typeof Setup2FAResponseSchema>;

export const Verify2FARequestSchema = z.object({
  code: z.string().min(6).max(8),
});
export type Verify2FARequest = z.infer<typeof Verify2FARequestSchema>;

export const SessionDtoSchema = z.object({
  id: z.string().uuid(),
  device: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  isCurrent: z.boolean(),
});
export type SessionDto = z.infer<typeof SessionDtoSchema>;

export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarMediaId: z.string().uuid().nullable().optional(),
  bannerMediaId: z.string().uuid().nullable().optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
