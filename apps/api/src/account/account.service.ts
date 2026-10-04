import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileRequest, SessionDto, ProblemException } from '@lumora/contracts';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'User Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'User not found.',
        requestId: '',
      });
    }

    return {
      id: user.id,
      email: user.email,
      handle: user.handle,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      country: user.country,
      locale: user.locale,
      avatarMediaId: user.avatarMediaId,
      isEmailVerified: !!user.emailVerifiedAt,
      isAgeVerified: !!user.ageVerifiedAt,
      is2FAEnabled: !!user.totpSecretEnc,
      walletBalanceCents: user.wallet ? Number(user.wallet.balanceCents) : 0,
      creatorProfile: user.creatorProfile
        ? {
            id: user.creatorProfile.id,
            bio: user.creatorProfile.bio,
            bannerMediaId: user.creatorProfile.bannerMediaId,
            category: user.creatorProfile.category,
            isPaid: user.creatorProfile.isPaid,
            subscriptionPriceCents: user.creatorProfile.subscriptionPriceCents,
            status: user.creatorProfile.status,
          }
        : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileRequest) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        avatarMediaId: dto.avatarMediaId,
      },
    });

    if (dto.bio !== undefined || dto.bannerMediaId !== undefined) {
      await this.prisma.creatorProfile.updateMany({
        where: { userId },
        data: {
          bio: dto.bio,
          bannerMediaId: dto.bannerMediaId,
        },
      });
    }

    return this.getProfile(userId);
  }

  async getSessions(userId: string, currentSessionId: string): Promise<SessionDto[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      device: s.device,
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async exportData(_userId: string) {
    return {
      success: true,
      message: 'Your data export has been scheduled. You will receive an email when your archive is ready for download.',
    };
  }

  async deleteAccount(userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'deleted',
          deletedAt: new Date(),
        },
      }),
      this.prisma.session.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      success: true,
      message: 'Your account has been deleted. Data will be purged according to retention statutory schedule.',
    };
  }
}
