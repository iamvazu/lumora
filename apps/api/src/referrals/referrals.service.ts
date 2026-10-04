import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import {
  CreatorReferralsSummaryDto,
  ReferralDto,
  ProblemException,
} from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  /**
   * Retrieves or initializes creator referral link and performance summary (Story E17-1)
   */
  async getSummary(creatorUserId: string): Promise<CreatorReferralsSummaryDto> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      include: { user: true },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Creator Profile Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Only approved creators can access the referral program.',
        requestId: '',
      });
    }

    const appUrl = this.configService.get<string>('APP_URL') || 'https://lumora.app';
    const referralCode = creator.user.handle;
    const referralUrl = `${appUrl}/signup?ref=${creator.user.handle}`;

    const now = new Date();

    const referrals = await this.prisma.referral.findMany({
      where: { referrerCreatorId: creator.userId },
      include: {
        referred: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalCommissionCents = 0;
    const mappedReferrals: ReferralDto[] = [];

    for (const ref of referrals) {
      const isActive = ref.expiresAt > now;

      // Aggregate purchases made for this referred creator to calculate 5% platform fee referral share
      const purchases = await this.prisma.purchase.aggregate({
        where: {
          sellerId: ref.referredCreatorId,
          status: 'succeeded',
        },
        _sum: {
          feeCents: true,
        },
      });

      // 5% of gross or 25% of platform fee (which is 20% of GMV -> 5% of GMV = 25% of fee)
      // Here: 500 bps (5%) of gross platform fee commission
      const totalFees = purchases._sum.feeCents || 0;
      const earnedCents = Math.floor((totalFees * ref.shareBps) / 2000); // 500/2000 = 25% of platform fee = 5% of gross
      totalCommissionCents += earnedCents;

      mappedReferrals.push({
        id: ref.id,
        referrerCreatorId: ref.referrerCreatorId,
        referredCreatorId: ref.referredCreatorId,
        referredHandle: ref.referred.handle,
        referredDisplayName: ref.referred.displayName,
        shareBps: ref.shareBps,
        totalEarnedCents: earnedCents,
        expiresAt: ref.expiresAt.toISOString(),
        createdAt: ref.createdAt.toISOString(),
        isActive,
      });
    }

    const activeCount = mappedReferrals.filter((r) => r.isActive).length;

    return {
      referralCode,
      referralUrl,
      sharePercent: 5,
      activeReferralsCount: activeCount,
      totalCommissionCents,
      referrals: mappedReferrals,
    };
  }

  /**
   * Attaches a referral to a newly registered creator (valid for 12 months)
   */
  async attachReferral(referrerHandle: string, referredUserId: string): Promise<ReferralDto | null> {
    const referrer = await this.prisma.user.findUnique({
      where: { handle: referrerHandle.toLowerCase() },
    });

    if (!referrer || referrer.id === referredUserId) {
      return null;
    }

    // Check if referral already exists
    const existing = await this.prisma.referral.findUnique({
      where: { referredCreatorId: referredUserId },
    });

    if (existing) {
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 12 months duration

    const referral = await this.prisma.referral.create({
      data: {
        id: uuidv7(),
        referrerCreatorId: referrer.id,
        referredCreatorId: referredUserId,
        shareBps: 500, // 5% = 500 bps
        expiresAt,
      },
      include: {
        referred: true,
      },
    });

    this.logger.log(`Referred creator ${referredUserId} linked to referrer ${referrer.handle} until ${expiresAt.toISOString()}`);

    return {
      id: referral.id,
      referrerCreatorId: referral.referrerCreatorId,
      referredCreatorId: referral.referredCreatorId,
      referredHandle: referral.referred.handle,
      referredDisplayName: referral.referred.displayName,
      shareBps: referral.shareBps,
      totalEarnedCents: 0,
      expiresAt: referral.expiresAt.toISOString(),
      createdAt: referral.createdAt.toISOString(),
      isActive: true,
    };
  }
}
