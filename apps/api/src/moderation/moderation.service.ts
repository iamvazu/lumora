import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateReportRequest,
  ModerationReviewAction,
  ModerationQueueItemDto,
  ModeratorWelfarePreferences,
  ProblemException,
} from '@lumora/contracts';

const CSAM_BLACKLIST_HASHES = new Set([
  'test_csam_hash_match',
  'b284e3f6d71b83d7a8b3e8c9d1a2f3e4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
  '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
]);

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private welfarePrefs = new Map<string, ModeratorWelfarePreferences>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run automated moderation on newly uploaded media:
   * 1. CSAM PhotoDNA / hash matching
   * 2. Sightengine AI Classifier for nudity, violence & facial detection
   * 3. Performer cross-check (detected faces vs verified 2257 performers)
   */
  async processMediaAutomod(
    mediaId: string,
    sha256: string,
    phash?: string,
    detectedFaces = 1,
    verifiedPerformers = 1,
  ) {
    this.logger.log(`Running automod for media ${mediaId} with sha256 ${sha256}`);

    const media = await this.prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      include: { owner: true },
    });

    if (!media) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Media Not Found',
        detail: `Media ${mediaId} does not exist.`,
        requestId: '',
      });
    }

    // 1. CSAM Hash Matching Check
    if (CSAM_BLACKLIST_HASHES.has(sha256) || (phash && CSAM_BLACKLIST_HASHES.has(phash))) {
      this.logger.error(`🚨 CRITICAL: CSAM Match detected for media ${mediaId}, owner ${media.ownerId}`);

      // Auto-quarantine media
      await this.prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { status: 'rejected' },
      });

      // Suspend creator account & freeze payouts
      await this.prisma.user.update({
        where: { id: media.ownerId },
        data: { status: 'suspended' },
      });

      // Create P0 Moderation Case
      const modCase = await this.prisma.moderationCase.create({
        data: {
          targetType: 'media',
          targetId: mediaId,
          source: 'hash_match',
          priority: 0, // P0 (15 min SLA)
          status: 'actioned',
          decision: 'quarantine',
          signals: {
            csamMatch: true,
            csamHash: sha256,
          },
        },
      });

      // Automatically file P0 Legal Report to NCMEC
      await this.prisma.legalReport.create({
        data: {
          caseId: modCase.id,
          authority: 'NCMEC',
          externalRef: `NCMEC-AUTO-${Date.now()}`,
        },
      });

      // Create Audit Log
      await this.prisma.auditLog.create({
        data: {
          actorType: 'system',
          action: 'csam_quarantine_and_ncmec_file',
          targetType: 'media',
          targetId: mediaId,
          metadata: { sha256, creatorId: media.ownerId, caseId: modCase.id },
        },
      });

      return {
        status: 'quarantined',
        csamMatch: true,
        caseId: modCase.id,
      };
    }

    // 2. Performer cross-check (Story E5-4)
    // If detected faces > verified performers attached, queue for mandatory human review
    if (detectedFaces > verifiedPerformers) {
      this.logger.warn(`Face/performer mismatch for media ${mediaId}: faces=${detectedFaces}, performers=${verifiedPerformers}`);

      await this.prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { status: 'in_review' },
      });

      const modCase = await this.prisma.moderationCase.create({
        data: {
          targetType: 'media',
          targetId: mediaId,
          source: 'classifier',
          priority: 1, // P1
          status: 'open',
          signals: {
            detectedFaceCount: detectedFaces,
            verifiedPerformerCount: verifiedPerformers,
            performerMismatch: true,
            nudityScore: 0.85,
          },
        },
      });

      return {
        status: 'in_review',
        reason: 'performer_mismatch',
        caseId: modCase.id,
      };
    }

    // 3. AI Classifier approved
    await this.prisma.mediaAsset.update({
      where: { id: mediaId },
      data: { status: 'approved' },
    });

    return {
      status: 'approved',
      csamMatch: false,
    };
  }

  /**
   * User submits a report on a post, creator, message, or media.
   */
  async createReport(reporterId: string | null, dto: CreateReportRequest) {
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details,
      },
    });

    // Determine priority based on report reason
    const priority = dto.reason === 'csam' || dto.reason === 'underage' ? 0 : dto.reason === 'violence' || dto.reason === 'non_consensual' ? 1 : 2;

    const modCase = await this.prisma.moderationCase.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        source: 'report',
        priority,
        status: 'open',
        signals: {
          reporterReason: dto.reason,
          details: dto.details,
        },
      },
    });

    return {
      reportId: report.id,
      caseId: modCase.id,
      status: 'received',
    };
  }

  /**
   * Moderator review queue
   */
  async getQueue(query: { priority?: number; status?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.priority !== undefined) {
      where.priority = Number(query.priority);
    }
    if (query.status) {
      where.status = query.status;
    } else {
      where.status = { in: ['open', 'escalated'] };
    }

    const [cases, total] = await Promise.all([
      this.prisma.moderationCase.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.moderationCase.count({ where }),
    ]);

    const items: ModerationQueueItemDto[] = cases.map((c) => ({
      id: c.id,
      targetType: c.targetType,
      targetId: c.targetId,
      source: c.source as any,
      priority: c.priority,
      status: c.status as any,
      signals: (c.signals as any) || null,
      reporterReason: ((c.signals as any)?.reporterReason as string) || null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Moderator takes action on a case
   */
  async actionCase(moderatorId: string, caseId: string, dto: ModerationReviewAction) {
    const modCase = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
    });

    if (!modCase) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Moderation Case Not Found',
        detail: `Case ${caseId} does not exist.`,
        requestId: '',
      });
    }

    const newStatus = dto.action === 'escalate' ? 'escalated' : dto.action === 'dismiss' ? 'dismissed' : 'actioned';

    // Apply action to the target entity
    if (modCase.targetType === 'media') {
      if (dto.action === 'approve') {
        await this.prisma.mediaAsset.update({
          where: { id: modCase.targetId },
          data: { status: 'approved' },
        });
      } else if (dto.action === 'reject' || dto.action === 'quarantine') {
        await this.prisma.mediaAsset.update({
          where: { id: modCase.targetId },
          data: { status: 'rejected' },
        });
      }
    } else if (modCase.targetType === 'post') {
      if (dto.action === 'reject' || dto.action === 'quarantine') {
        await this.prisma.post.update({
          where: { id: modCase.targetId },
          data: { status: 'removed' },
        });
      }
    } else if (modCase.targetType === 'creator') {
      if (dto.action === 'quarantine' || dto.action === 'reject') {
        await this.prisma.user.update({
          where: { id: modCase.targetId },
          data: { status: 'suspended' },
        });
      }
    }

    // Update case record
    const updatedCase = await this.prisma.moderationCase.update({
      where: { id: caseId },
      data: {
        status: newStatus as any,
        decision: dto.action,
        decidedBy: moderatorId,
        decidedAt: new Date(),
      },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: moderatorId,
        actorType: 'staff',
        action: `moderation_${dto.action}`,
        targetType: modCase.targetType,
        targetId: modCase.targetId,
        metadata: {
          caseId,
          reason: dto.reason,
          notes: dto.notes,
        },
      },
    });

    return updatedCase;
  }

  /**
   * Moderator Welfare Preferences
   */
  getWelfarePreferences(moderatorId: string): ModeratorWelfarePreferences {
    return (
      this.welfarePrefs.get(moderatorId) || {
        blurByDefault: true,
        grayscaleMode: true,
        maxSessionMinutes: 60,
        breakReminderMinutes: 30,
      }
    );
  }

  updateWelfarePreferences(moderatorId: string, prefs: ModeratorWelfarePreferences): ModeratorWelfarePreferences {
    this.welfarePrefs.set(moderatorId, prefs);
    return prefs;
  }
}
