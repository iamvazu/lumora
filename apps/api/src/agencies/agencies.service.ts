import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateAgencyRequest,
  AgencyDto,
  InviteCreatorRequest,
  AgencyCreatorDto,
  AddAgencyMemberRequest,
  AgencyMemberDto,
  AgencyEarningsSummaryDto,
  ProblemException,
} from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class AgenciesService {
  private readonly logger = new Logger(AgenciesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Registers a new B2B Agency account (Story E17-2)
   */
  async createAgency(ownerUserId: string, dto: CreateAgencyRequest): Promise<AgencyDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
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

    const agency = await this.prisma.agency.create({
      data: {
        id: uuidv7(),
        ownerUserId,
        legalEntityRef: dto.legalEntityRef,
        status: 'active',
      },
    });

    // Add owner as agency member with owner role
    await this.prisma.agencyMember.create({
      data: {
        id: uuidv7(),
        agencyId: agency.id,
        userId: ownerUserId,
        role: 'owner',
        scopes: ['all'],
      },
    });

    this.logger.log(`Agency created: ${agency.id} by user ${ownerUserId}`);

    return {
      id: agency.id,
      ownerUserId: agency.ownerUserId,
      legalEntityRef: agency.legalEntityRef,
      status: agency.status as any,
      creatorCount: 0,
      memberCount: 1,
      createdAt: agency.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves agency details
   */
  async getAgency(userId: string, agencyId?: string): Promise<AgencyDto> {
    const member = await this.prisma.agencyMember.findFirst({
      where: agencyId ? { agencyId, userId } : { userId },
      include: {
        agency: {
          include: {
            _count: {
              select: { creators: true, members: true },
            },
          },
        },
      },
    });

    if (!member) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: 'Agency Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'You are not a member of any agency.',
        requestId: '',
      });
    }

    return {
      id: member.agency.id,
      ownerUserId: member.agency.ownerUserId,
      legalEntityRef: member.agency.legalEntityRef,
      status: member.agency.status as any,
      creatorCount: member.agency._count.creators,
      memberCount: member.agency._count.members,
      createdAt: member.agency.createdAt.toISOString(),
    };
  }

  /**
   * Sends an invitation to manage a creator with proposed revenue split (Story E17-2)
   */
  async inviteCreator(
    userId: string,
    agencyId: string,
    dto: InviteCreatorRequest
  ): Promise<AgencyCreatorDto> {
    await this.assertAgencyAdmin(userId, agencyId);

    const targetUser = await this.prisma.user.findUnique({
      where: { handle: dto.creatorHandle.toLowerCase() },
      include: { creatorProfile: true },
    });

    if (!targetUser || !targetUser.creatorProfile) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Creator Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: `No creator found with handle @${dto.creatorHandle}.`,
        requestId: '',
      });
    }

    const creatorId = targetUser.creatorProfile.id;

    // Check existing linkage
    const existing = await this.prisma.agencyCreator.findUnique({
      where: {
        agencyId_creatorId: { agencyId, creatorId },
      },
    });

    if (existing && existing.status === 'active') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/conflict',
        title: 'Creator Already Managed',
        status: 409,
        code: 'CONFLICT',
        detail: 'This creator is already actively linked with your agency.',
        requestId: '',
      });
    }

    const agencyCreator = await this.prisma.agencyCreator.upsert({
      where: {
        agencyId_creatorId: { agencyId, creatorId },
      },
      create: {
        id: uuidv7(),
        agencyId,
        creatorId,
        splitBps: dto.splitBps,
        status: 'invited',
      },
      update: {
        splitBps: dto.splitBps,
        status: 'invited',
      },
      include: {
        creator: { include: { user: true } },
      },
    });

    this.logger.log(`Agency ${agencyId} invited creator ${creatorId} (split: ${dto.splitBps} bps)`);

    return {
      id: agencyCreator.id,
      agencyId: agencyCreator.agencyId,
      creatorId: agencyCreator.creatorId,
      creatorHandle: agencyCreator.creator.user.handle,
      creatorDisplayName: agencyCreator.creator.user.displayName,
      splitBps: agencyCreator.splitBps,
      status: agencyCreator.status as any,
      creatorConsentedAt: agencyCreator.creatorConsentedAt?.toISOString() || null,
      createdAt: agencyCreator.createdAt.toISOString(),
    };
  }

  /**
   * Creator explicitly accepts or consents to agency management (Story E17-2)
   */
  async acceptInvitation(creatorUserId: string, inviteId: string): Promise<AgencyCreatorDto> {
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
        detail: 'Creator profile not found.',
        requestId: '',
      });
    }

    const invitation = await this.prisma.agencyCreator.findUnique({
      where: { id: inviteId },
      include: { creator: { include: { user: true } } },
    });

    if (!invitation || invitation.creatorId !== creator.id) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Invitation Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Agency invitation not found or not addressed to you.',
        requestId: '',
      });
    }

    const updated = await this.prisma.agencyCreator.update({
      where: { id: inviteId },
      data: {
        status: 'active',
        creatorConsentedAt: new Date(),
      },
      include: { creator: { include: { user: true } } },
    });

    this.logger.log(`Creator ${creator.id} consented to Agency ${invitation.agencyId} management`);

    return {
      id: updated.id,
      agencyId: updated.agencyId,
      creatorId: updated.creatorId,
      creatorHandle: updated.creator.user.handle,
      creatorDisplayName: updated.creator.user.displayName,
      splitBps: updated.splitBps,
      status: updated.status as any,
      creatorConsentedAt: updated.creatorConsentedAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves all creators managed by the agency
   */
  async getAgencyCreators(userId: string, agencyId: string): Promise<AgencyCreatorDto[]> {
    await this.assertAgencyMember(userId, agencyId);

    const creators = await this.prisma.agencyCreator.findMany({
      where: { agencyId },
      include: {
        creator: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return creators.map((c) => ({
      id: c.id,
      agencyId: c.agencyId,
      creatorId: c.creatorId,
      creatorHandle: c.creator.user.handle,
      creatorDisplayName: c.creator.user.displayName,
      splitBps: c.splitBps,
      status: c.status as any,
      creatorConsentedAt: c.creatorConsentedAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /**
   * Adds a chatter or manager seat to the agency with scoped inbox access (Story E17-2)
   */
  async addMember(
    userId: string,
    agencyId: string,
    dto: AddAgencyMemberRequest
  ): Promise<AgencyMemberDto> {
    await this.assertAgencyAdmin(userId, agencyId);

    const memberUser = await this.prisma.user.findUnique({
      where: { handle: dto.userHandle.toLowerCase() },
    });

    if (!memberUser) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'User Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: `No user found with handle @${dto.userHandle}.`,
        requestId: '',
      });
    }

    const scopes =
      dto.role === 'chatter'
        ? ['inbox:read', 'inbox:reply']
        : dto.scopes || ['inbox:read', 'inbox:reply', 'creators:manage'];

    const member = await this.prisma.agencyMember.upsert({
      where: {
        agencyId_userId: { agencyId, userId: memberUser.id },
      },
      create: {
        id: uuidv7(),
        agencyId,
        userId: memberUser.id,
        role: dto.role,
        scopes,
      },
      update: {
        role: dto.role,
        scopes,
      },
      include: { user: true },
    });

    this.logger.log(`Added agency member ${memberUser.handle} to agency ${agencyId} as ${dto.role}`);

    return {
      id: member.id,
      agencyId: member.agencyId,
      userId: member.userId,
      userHandle: member.user.handle,
      userDisplayName: member.user.displayName,
      role: member.role as any,
      scopes: member.scopes,
      createdAt: member.createdAt.toISOString(),
    };
  }

  /**
   * Removes a member from the agency
   */
  async removeMember(userId: string, agencyId: string, targetUserId: string): Promise<void> {
    await this.assertAgencyAdmin(userId, agencyId);

    const target = await this.prisma.agencyMember.findUnique({
      where: { agencyId_userId: { agencyId, userId: targetUserId } },
    });

    if (!target) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Member Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Member not found in this agency.',
        requestId: '',
      });
    }

    if (target.role === 'owner') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'Cannot remove the agency owner.',
        requestId: '',
      });
    }

    await this.prisma.agencyMember.delete({
      where: { agencyId_userId: { agencyId, userId: targetUserId } },
    });

    this.logger.log(`Removed member ${targetUserId} from agency ${agencyId}`);
  }

  /**
   * Retrieves aggregated earnings for the agency
   */
  async getEarnings(userId: string, agencyId: string): Promise<AgencyEarningsSummaryDto> {
    const member = await this.assertAgencyMember(userId, agencyId);

    // Strict 403 for chatters on financial views (Story E17-2)
    if (member.role === 'chatter') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: 'Access Denied',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'Scoped chatters are strictly blocked from viewing earnings and financial statements.',
        requestId: '',
      });
    }

    const managedCreators = await this.prisma.agencyCreator.findMany({
      where: { agencyId, status: 'active' },
      include: { creator: true },
    });

    const creatorIds = managedCreators.map((c) => c.creator.userId);

    let totalGrossCents = 0;
    let agencyCommissionCents = 0;
    let creatorEarningsCents = 0;

    for (const mc of managedCreators) {
      const purchases = await this.prisma.purchase.aggregate({
        where: {
          sellerId: mc.creator.userId,
          status: 'succeeded',
        },
        _sum: {
          grossCents: true,
          netCents: true,
        },
      });

      const creatorGross = purchases._sum.grossCents || 0;
      const creatorNet = purchases._sum.netCents || 0;

      // Agency cut from creator's net take
      const agencyCut = Math.floor((creatorNet * mc.splitBps) / 10000);
      const remainingCreatorTake = creatorNet - agencyCut;

      totalGrossCents += creatorGross;
      agencyCommissionCents += agencyCut;
      creatorEarningsCents += remainingCreatorTake;
    }

    return {
      totalGrossCents,
      agencyCommissionCents,
      creatorEarningsCents,
      managedCreatorsCount: creatorIds.length,
    };
  }

  private async assertAgencyMember(userId: string, agencyId: string) {
    const member = await this.prisma.agencyMember.findUnique({
      where: { agencyId_userId: { agencyId, userId } },
    });

    if (!member) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'You are not a member of this agency.',
        requestId: '',
      });
    }

    return member;
  }

  private async assertAgencyAdmin(userId: string, agencyId: string) {
    const member = await this.assertAgencyMember(userId, agencyId);
    if (member.role !== 'owner' && member.role !== 'manager') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'Only agency owners and managers can perform this operation.',
        requestId: '',
      });
    }
    return member;
  }
}
