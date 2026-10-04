import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { ProblemException, CreateStreamRequest, StreamDto, JoinStreamResponse } from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';
import * as crypto from 'node:crypto';

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  /**
   * Generates a signed LiveKit Access Token
   */
  private generateLiveKitToken(
    identity: string,
    name: string,
    roomName: string,
    isPublisher: boolean
  ): { token: string; expiresAt: Date } {
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || 'devkey';
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || 'secret_livekit_key_for_lumora_1234567890';
    const ttlSeconds = 7200; // 2 hours TTL
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload = {
      sub: identity,
      name,
      iss: apiKey,
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: isPublisher,
        canSubscribe: true,
        canPublishData: true,
      },
    };

    const base64UrlEncode = (obj: any) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(unsignedToken)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const token = `${unsignedToken}.${signature}`;
    return { token, expiresAt };
  }

  /**
   * Creates a new live stream (Story E14-1)
   */
  async createStream(creatorUserId: string, dto: CreateStreamRequest): Promise<StreamDto> {
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
        detail: 'Only approved creators can schedule or start live streams.',
        requestId: '',
      });
    }

    const roomName = `room-${uuidv7().substring(0, 12)}`;

    const stream = await this.prisma.liveStream.create({
      data: {
        creatorId: creator.id,
        title: dto.title,
        access: dto.access,
        ticketPriceCents: dto.ticketPriceCents,
        tipGoalCents: dto.tipGoalCents,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        roomName,
        status: 'scheduled',
      },
      include: {
        creator: {
          include: { user: true },
        },
      },
    });

    this.logger.log(`Created stream ${stream.id} (${stream.roomName}) for creator ${creator.id}`);

    return this.mapToStreamDto(stream, creatorUserId, true, 0);
  }

  /**
   * Starts a live stream and transitions to live status
   */
  async startStream(creatorUserId: string, streamId: string): Promise<JoinStreamResponse> {
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

    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== creator.id) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Live Stream Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Live stream not found or not owned by you.',
        requestId: '',
      });
    }

    // Update status to live
    await this.prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'live',
        startedAt: new Date(),
      },
    });

    const livekitUrl = this.configService.get<string>('LIVEKIT_WS_URL') || 'wss://live.lumora.app';
    const { token, expiresAt } = this.generateLiveKitToken(
      creatorUserId,
      creator.user.displayName,
      stream.roomName,
      true // Publisher
    );

    this.logger.log(`Stream ${streamId} is now LIVE in room ${stream.roomName}`);

    return {
      streamId: stream.id,
      roomName: stream.roomName,
      livekitToken: token,
      serverUrl: livekitUrl,
      isPublisher: true,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Ends a live stream and records duration / metrics
   */
  async endStream(creatorUserId: string, streamId: string): Promise<StreamDto> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      include: { user: true },
    });

    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: { creator: { include: { user: true } } },
    });

    if (!stream || !creator || stream.creatorId !== creator.id) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Live Stream Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Stream not found or not owned by you.',
        requestId: '',
      });
    }

    const updated = await this.prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
      include: {
        creator: { include: { user: true } },
      },
    });

    this.logger.log(`Stream ${streamId} ended.`);

    return this.mapToStreamDto(updated, creatorUserId, true, 0);
  }

  /**
   * Checks entitlement and mints viewer LiveKit token (Story E14-1)
   */
  async joinStream(viewerUserId: string, streamId: string): Promise<JoinStreamResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: viewerUserId },
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

    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: { creator: { include: { user: true } } },
    });

    if (!stream) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Live Stream Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'The requested live stream does not exist.',
        requestId: '',
      });
    }

    if (stream.status !== 'live' && stream.status !== 'scheduled') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/bad-request',
        title: 'Stream Not Active',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'This stream has ended or is not currently active.',
        requestId: '',
      });
    }

    const isCreatorOwner = stream.creator.userId === viewerUserId;
    let isEntitled = isCreatorOwner;

    if (!isEntitled) {
      if (stream.access === 'free_followers') {
        isEntitled = true;
      } else if (stream.access === 'subscribers') {
        // Check active subscription
        const activeSub = await this.prisma.subscription.findFirst({
          where: {
            fanId: viewerUserId,
            creatorId: stream.creator.userId,
            status: 'active',
          },
        });
        isEntitled = !!activeSub;
      } else if (stream.access === 'ticketed') {
        // Check stream ticket entitlement
        const ticketEntitlement = await this.prisma.entitlement.findUnique({
          where: {
            userId_resourceType_resourceId: {
              userId: viewerUserId,
              resourceType: 'stream',
              resourceId: stream.id,
            },
          },
        });
        isEntitled = !!ticketEntitlement;
      }
    }

    if (!isEntitled) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: 'Access Restricted',
        status: 403,
        code: 'NOT_ENTITLED',
        detail:
          stream.access === 'ticketed'
            ? 'A ticket purchase is required to join this live stream.'
            : 'An active creator subscription is required to join this live stream.',
        requestId: '',
      });
    }

    const livekitUrl = this.configService.get<string>('LIVEKIT_WS_URL') || 'wss://live.lumora.app';
    const { token, expiresAt } = this.generateLiveKitToken(
      viewerUserId,
      user.displayName,
      stream.roomName,
      isCreatorOwner
    );

    return {
      streamId: stream.id,
      roomName: stream.roomName,
      livekitToken: token,
      serverUrl: livekitUrl,
      isPublisher: isCreatorOwner,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Retrieves stream metadata
   */
  async getStream(streamId: string, viewerUserId?: string): Promise<StreamDto> {
    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: { creator: { include: { user: true } } },
    });

    if (!stream) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Stream Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Live stream not found.',
        requestId: '',
      });
    }

    let isEntitled = false;
    if (viewerUserId) {
      if (stream.creator.userId === viewerUserId || stream.access === 'free_followers') {
        isEntitled = true;
      } else if (stream.access === 'subscribers') {
        const sub = await this.prisma.subscription.findFirst({
          where: { fanId: viewerUserId, creatorId: stream.creator.userId, status: 'active' },
        });
        isEntitled = !!sub;
      } else if (stream.access === 'ticketed') {
        const ent = await this.prisma.entitlement.findUnique({
          where: {
            userId_resourceType_resourceId: {
              userId: viewerUserId,
              resourceType: 'stream',
              resourceId: stream.id,
            },
          },
        });
        isEntitled = !!ent;
      }
    }

    // Compute tip goal progress
    const tipSum = await this.prisma.purchase.aggregate({
      where: {
        resourceId: stream.id,
        type: { in: ['stream_gift', 'tip'] },
        status: 'succeeded',
      },
      _sum: {
        grossCents: true,
      },
    });

    const tipProgressCents = tipSum._sum.grossCents || 0;

    return this.mapToStreamDto(stream, viewerUserId, isEntitled, tipProgressCents);
  }

  private mapToStreamDto(
    stream: any,
    _viewerUserId?: string,
    isEntitled = false,
    tipProgressCents = 0
  ): StreamDto {
    return {
      id: stream.id,
      creatorId: stream.creator.id,
      creatorHandle: stream.creator.user.handle,
      creatorDisplayName: stream.creator.user.displayName,
      creatorAvatarUrl: null,
      title: stream.title,
      access: stream.access,
      ticketPriceCents: stream.ticketPriceCents,
      status: stream.status,
      roomName: stream.roomName,
      scheduledAt: stream.scheduledAt ? stream.scheduledAt.toISOString() : null,
      startedAt: stream.startedAt ? stream.startedAt.toISOString() : null,
      endedAt: stream.endedAt ? stream.endedAt.toISOString() : null,
      peakViewers: stream.peakViewers || 0,
      currentViewers: stream.status === 'live' ? 12 : 0,
      tipGoalCents: stream.tipGoalCents,
      tipProgressCents,
      isEntitled,
      createdAt: stream.createdAt.toISOString(),
    };
  }
}
