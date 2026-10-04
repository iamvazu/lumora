import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ApplyCreatorRequest,
  TaxProfileRequest,
  UpdateCreatorProfileRequest,
  CreatorProfileDto,
  ProblemException,
} from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class CreatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Applies for creator status (Flow A, step 2)
   */
  async apply(userId: string, dto: ApplyCreatorRequest) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { creatorProfile: true },
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

    // 2FA is mandatory before creator application
    if (!user.totpSecretEnc) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: '2FA Required',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'Two-factor authentication (TOTP) must be enabled before applying for a creator account.',
        requestId: '',
      });
    }

    if (user.creatorProfile) {
      return user.creatorProfile;
    }

    const referralCode = `${user.handle}_${uuidv7().substring(0, 6)}`;

    // Create Creator Profile with draft status
    const profile = await this.prisma.$transaction(async (tx) => {
      const p = await tx.creatorProfile.create({
        data: {
          userId,
          bio: dto.bio,
          category: dto.category,
          isPaid: dto.isPaid,
          subscriptionPriceCents: dto.subscriptionPriceCents,
          currency: dto.currency || 'USD',
          status: 'draft',
          referralCode,
        },
      });

      // Update user role to creator
      await tx.user.update({
        where: { id: userId },
        data: { role: 'creator' },
      });

      // Initialize default subscription plan (1 month)
      await tx.subscriptionPlan.create({
        data: {
          creatorId: p.id,
          tierName: 'Standard Monthly',
          periodMonths: 1,
          priceCents: dto.subscriptionPriceCents,
          discountPct: 0,
        },
      });

      // Initialize creator ledger balance row
      await tx.creatorBalance.create({
        data: {
          creatorId: p.id,
          pendingCents: 0n,
          availableCents: 0n,
        },
      });

      return p;
    });

    return profile;
  }

  /**
   * Generates a KYC session with identity verification vendor (Veriff / Persona)
   */
  async createKycSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { creatorProfile: true },
    });

    if (!user || !user.creatorProfile) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Creator Profile Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Please submit a creator application first.',
        requestId: '',
      });
    }

    const sessionId = uuidv7();
    const vendorRef = `kyc_veriff_${uuidv7()}`;

    const verification = await this.prisma.verification.create({
      data: {
        id: sessionId,
        subjectUserId: userId,
        provider: 'mock_veriff',
        providerRef: vendorRef,
        type: 'id_liveness',
        status: 'pending',
      },
    });

    return {
      verificationId: verification.id,
      vendorRef,
      sdkToken: `sdk_jwt_${uuidv7()}`,
      vendorUrl: `https://kyc.lumora.app/verify/${vendorRef}`,
    };
  }

  /**
   * Retrieves creator onboarding and profile status
   */
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: true,
        verificationsAsSubject: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        taxProfiles: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        payoutMethods: true,
      },
    });

    if (!user || !user.creatorProfile) {
      return {
        hasApplied: false,
        status: 'not_applied',
      };
    }

    const latestKyc = user.verificationsAsSubject[0];
    const latestTax = user.taxProfiles[0];
    const hasPayoutMethod = user.payoutMethods.length > 0;

    return {
      hasApplied: true,
      creatorId: user.creatorProfile.id,
      status: user.creatorProfile.status,
      approvedAt: user.creatorProfile.approvedAt,
      steps: {
        application: true,
        kycStatus: latestKyc ? latestKyc.status : 'pending',
        taxProfileSubmitted: !!latestTax,
        payoutMethodAdded: hasPayoutMethod,
        readyForReview:
          latestKyc?.status === 'approved' && !!latestTax && hasPayoutMethod,
      },
    };
  }

  /**
   * Submits tax compliance form (W-9 / W-8BEN)
   */
  async submitTaxProfile(userId: string, dto: TaxProfileRequest) {
    const taxProfile = await this.prisma.taxProfile.create({
      data: {
        userId,
        formType: dto.formType,
        country: dto.country,
        taxIdRef: `pii_ref_tax_${uuidv7()}`,
        status: 'submitted',
      },
    });

    // If KYC is already approved, move creator status to pending_review
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: true,
        verificationsAsSubject: {
          where: { status: 'approved' },
        },
      },
    });

    if (user?.creatorProfile && user.verificationsAsSubject.length > 0) {
      await this.prisma.creatorProfile.update({
        where: { id: user.creatorProfile.id },
        data: { status: 'pending_review' },
      });
    }

    return {
      id: taxProfile.id,
      formType: taxProfile.formType,
      status: taxProfile.status,
      submittedAt: taxProfile.submittedAt.toISOString(),
    };
  }

  /**
   * Process KYC Webhook from vendor (Story E3-1)
   */
  async processKycWebhook(vendorRef: string, payload: {
    status: 'approved' | 'rejected';
    score: number;
    age: number;
    docMatch: boolean;
    sanctionsHit: boolean;
  }) {
    const verification = await this.prisma.verification.findFirst({
      where: { providerRef: vendorRef },
      include: { subjectUser: { include: { creatorProfile: true } } },
    });

    if (!verification) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Verification Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Verification record for provider ref not found.',
        requestId: '',
      });
    }

    // Reject if age < 18, doc mismatch, or sanctions hit
    if (payload.age < 18 || !payload.docMatch || payload.sanctionsHit || payload.status === 'rejected') {
      await this.prisma.verification.update({
        where: { id: verification.id },
        data: {
          status: 'rejected',
          resultJson: payload,
        },
      });

      if (verification.subjectUser?.creatorProfile) {
        await this.prisma.creatorProfile.update({
          where: { id: verification.subjectUser.creatorProfile.id },
          data: { status: 'rejected' },
        });
      }

      return { status: 'rejected', reason: 'COMPLIANCE_FAILED' };
    }

    // If vendor confidence score is below threshold (0.85), route to admin queue
    const isHighConfidence = payload.score >= 0.85;
    const newStatus = isHighConfidence ? 'approved' : 'pending';

    await this.prisma.verification.update({
      where: { id: verification.id },
      data: {
        status: newStatus,
        resultJson: payload,
      },
    });

    if (verification.subjectUserId) {
      await this.prisma.user.update({
        where: { id: verification.subjectUserId },
        data: {
          ageVerifiedAt: new Date(),
          ageVerificationMethod: 'id_liveness',
        },
      });
    }

    if (verification.subjectUser?.creatorProfile) {
      await this.prisma.creatorProfile.update({
        where: { id: verification.subjectUser.creatorProfile.id },
        data: {
          status: isHighConfidence ? 'pending_review' : 'draft',
        },
      });
    }

    return { status: newStatus, confidence: payload.score };
  }

  /**
   * Get public creator profile by handle (Story E6-1)
   */
  async getPublicProfile(handle: string, viewerUserId?: string): Promise<CreatorProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      include: {
        creatorProfile: {
          include: {
            _count: {
              select: {
                followers: true,
                subscriptions: {
                  where: { status: 'active' },
                },
                posts: {
                  where: { status: 'published' },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.creatorProfile) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Creator Not Found',
        detail: `No creator profile found with handle @${handle}`,
        requestId: '',
      });
    }

    const profile = user.creatorProfile;

    let isFollowing = false;
    let isSubscribed = false;

    if (viewerUserId) {
      const [follow, sub] = await Promise.all([
        this.prisma.follow.findUnique({
          where: {
            followerId_creatorId: {
              followerId: viewerUserId,
              creatorId: profile.id,
            },
          },
        }),
        this.prisma.subscription.findFirst({
          where: {
            fanId: viewerUserId,
            creatorId: profile.id,
            status: 'active',
          },
        }),
      ]);

      isFollowing = !!follow;
      isSubscribed = !!sub;
    }

    return {
      id: profile.id,
      userId: user.id,
      handle: user.handle,
      displayName: user.displayName,
      avatarMediaId: user.avatarMediaId,
      bannerMediaId: profile.bannerMediaId,
      bio: profile.bio,
      category: profile.category,
      isPaid: profile.isPaid,
      subscriptionPriceCents: profile.subscriptionPriceCents,
      currency: profile.currency,
      commentsEnabled: profile.commentsEnabled,
      status: profile.status as any,
      followerCount: profile._count.followers,
      subscriberCount: profile._count.subscriptions,
      postCount: profile._count.posts,
      mediaCount: profile._count.posts,
      isFollowing,
      isSubscribed,
    };
  }

  /**
   * Update creator profile (Story E6-1)
   */
  async updateProfile(userId: string, dto: UpdateCreatorProfileRequest) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { creatorProfile: true },
    });

    if (!user || !user.creatorProfile) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Creator Not Found',
        detail: 'Creator profile not found.',
        requestId: '',
      });
    }

    const updateData: any = {};
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.isPaid !== undefined) updateData.isPaid = dto.isPaid;
    if (dto.subscriptionPriceCents !== undefined) updateData.subscriptionPriceCents = dto.subscriptionPriceCents;
    if (dto.commentsEnabled !== undefined) updateData.commentsEnabled = dto.commentsEnabled;
    if (dto.avatarMediaId !== undefined) updateData.avatarMediaId = dto.avatarMediaId;
    if (dto.bannerMediaId !== undefined) updateData.bannerMediaId = dto.bannerMediaId;

    if (dto.displayName !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { displayName: dto.displayName },
      });
    }

    const updatedProfile = await this.prisma.creatorProfile.update({
      where: { id: user.creatorProfile.id },
      data: updateData,
    });

    return updatedProfile;
  }

  /**
   * Follow a creator
   */
  async follow(followerId: string, creatorHandleOrId: string) {
    const creator = await this.prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorHandleOrId }, { user: { handle: creatorHandleOrId } }],
      },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Creator Not Found',
        detail: 'Creator not found.',
        requestId: '',
      });
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_creatorId: {
          followerId,
          creatorId: creator.id,
        },
      },
      create: {
        followerId,
        creatorId: creator.id,
      },
      update: {},
    });

    return { following: true };
  }

  /**
   * Unfollow a creator
   */
  async unfollow(followerId: string, creatorHandleOrId: string) {
    const creator = await this.prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorHandleOrId }, { user: { handle: creatorHandleOrId } }],
      },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Creator Not Found',
        detail: 'Creator not found.',
        requestId: '',
      });
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        creatorId: creator.id,
      },
    });

    return { following: false };
  }
}
