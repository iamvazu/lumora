import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProblemException } from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';

export interface CreatePerformerDto {
  legalName: string;
  stageName: string;
  dob: string;
  releaseDocRef?: string;
}

@Injectable()
export class PerformersService {
  constructor(private prisma: PrismaService) {}

  async createPerformer(userId: string, dto: CreatePerformerDto) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Creator Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Only registered creators can add co-performers.',
        requestId: '',
      });
    }

    const performer = await this.prisma.performer.create({
      data: {
        creatorId: creator.id,
        legalNameRef: `pii_legal_name_${uuidv7()}`,
        stageName: dto.stageName,
        dobRef: `pii_dob_${uuidv7()}`,
        releaseDocRef: dto.releaseDocRef || `pii_release_${uuidv7()}`,
        status: 'pending',
      },
    });

    return {
      id: performer.id,
      stageName: performer.stageName,
      status: performer.status,
      createdAt: performer.createdAt.toISOString(),
    };
  }

  async createKycInvite(userId: string, performerId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    const performer = await this.prisma.performer.findFirst({
      where: { id: performerId, creatorId: creator?.id },
    });

    if (!performer) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Performer Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Performer record not found under your creator profile.',
        requestId: '',
      });
    }

    const inviteToken = uuidv7();
    const verificationSession = await this.prisma.verification.create({
      data: {
        subjectPerformerId: performer.id,
        provider: 'mock_veriff_performer',
        providerRef: `performer_invite_${inviteToken}`,
        type: 'id_liveness',
        status: 'pending',
      },
    });

    await this.prisma.performer.update({
      where: { id: performer.id },
      data: { verificationId: verificationSession.id },
    });

    return {
      inviteUrl: `https://lumora.app/verify/performer/${inviteToken}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async getPerformers(userId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creator) return [];

    const performers = await this.prisma.performer.findMany({
      where: { creatorId: creator.id },
      include: { verification: true },
      orderBy: { createdAt: 'desc' },
    });

    return performers.map((p) => ({
      id: p.id,
      stageName: p.stageName,
      status: p.status,
      verificationStatus: p.verification?.status || 'pending',
      createdAt: p.createdAt.toISOString(),
    }));
  }
}
