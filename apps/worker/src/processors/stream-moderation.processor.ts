import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@lumora/db';
import * as crypto from 'node:crypto';

export interface FrameModerationSignal {
  streamId: string;
  sha256?: string;
  pdqHash?: string;
  csamMatch?: boolean;
  severeViolation?: boolean;
  detectedUnderageScore?: number;
}

@Injectable()
export class StreamModerationProcessor {
  private readonly logger = new Logger(StreamModerationProcessor.name);
  private prisma = new PrismaClient();

  /**
   * Scans active live streams and samples frame hashes (Story E14-2)
   */
  async processActiveStreams(): Promise<{ sampledStreamsCount: number; killedStreamsCount: number }> {
    const activeStreams = await this.prisma.liveStream.findMany({
      where: {
        status: 'live',
      },
      include: {
        creator: { include: { user: true } },
      },
      take: 50,
    });

    this.logger.log(`Checking ${activeStreams.length} active live streams for real-time compliance`);

    let killedStreamsCount = 0;

    for (const stream of activeStreams) {
      // Simulate frame classifier sampling
      const signal = await this.sampleStreamFrame(stream.id);

      if (signal.csamMatch || signal.severeViolation || (signal.detectedUnderageScore && signal.detectedUnderageScore > 0.9)) {
        this.logger.error(`🚨 CRITICAL: Stream ${stream.id} violated P0 policy. Triggering auto-kill switch.`);
        await this.terminateStreamOnViolation(stream, signal);
        killedStreamsCount++;
      }
    }

    return {
      sampledStreamsCount: activeStreams.length,
      killedStreamsCount,
    };
  }

  /**
   * Samples latest frame from stream ingress
   */
  async sampleStreamFrame(streamId: string): Promise<FrameModerationSignal> {
    // In production, pulls keyframe buffer from WHIP/HLS ingress and submits to AWS Rekognition / PhotoDNA
    return {
      streamId,
      csamMatch: false,
      severeViolation: false,
      detectedUnderageScore: 0.0,
    };
  }

  /**
   * Immediate stream kill-switch & P0 case creation
   */
  async terminateStreamOnViolation(stream: any, signal: FrameModerationSignal) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Terminate stream immediately
      await tx.liveStream.update({
        where: { id: stream.id },
        data: {
          status: 'removed',
          endedAt: new Date(),
        },
      });

      // 2. Suspend creator account
      await tx.user.update({
        where: { id: stream.creator.userId },
        data: { status: 'suspended' },
      });

      // 3. Open P0 Moderation Case
      const modCase = await tx.moderationCase.create({
        data: {
          targetType: 'stream',
          targetId: stream.id,
          source: 'classifier',
          priority: 0,
          status: 'actioned',
          signals: signal as any,
          decision: 'auto_terminated_p0',
        },
      });

      // 4. File NCMEC legal referral if CSAM detected
      if (signal.csamMatch) {
        await tx.legalReport.create({
          data: {
            caseId: modCase.id,
            authority: 'NCMEC',
            externalRef: `ref_${crypto.randomUUID()}`,
          },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          actorType: 'system',
          action: 'stream.auto_kill_p0',
          targetType: 'stream',
          targetId: stream.id,
          metadata: { signal } as any,
        },
      });
    });

    this.logger.warn(`Stream ${stream.id} terminated and creator ${stream.creator.userId} suspended.`);
  }
}
