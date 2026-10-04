import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LiveService } from './live.service.js';
import { LiveChatService } from './live-chat.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  CreateStreamRequest,
  StreamChatSendRequest,
  StreamDto,
  JoinStreamResponse,
  StreamChatMessageDto,
} from '@lumora/contracts';

@Controller()
export class LiveController {
  constructor(
    private readonly liveService: LiveService,
    private readonly liveChatService: LiveChatService
  ) {}

  @Post('creator/streams')
  @UseGuards(JwtAuthGuard)
  async createStream(
    @CurrentUser('id') creatorUserId: string,
    @Body() dto: CreateStreamRequest
  ): Promise<StreamDto> {
    return this.liveService.createStream(creatorUserId, dto);
  }

  @Post('creator/streams/:id/start')
  @UseGuards(JwtAuthGuard)
  async startStream(
    @CurrentUser('id') creatorUserId: string,
    @Param('id') streamId: string
  ): Promise<JoinStreamResponse> {
    return this.liveService.startStream(creatorUserId, streamId);
  }

  @Post('creator/streams/:id/end')
  @UseGuards(JwtAuthGuard)
  async endStream(
    @CurrentUser('id') creatorUserId: string,
    @Param('id') streamId: string
  ): Promise<StreamDto> {
    return this.liveService.endStream(creatorUserId, streamId);
  }

  @Post('streams/:id/join')
  @UseGuards(JwtAuthGuard)
  async joinStream(
    @CurrentUser('id') viewerUserId: string,
    @Param('id') streamId: string
  ): Promise<JoinStreamResponse> {
    return this.liveService.joinStream(viewerUserId, streamId);
  }

  @Get('streams/:id')
  async getStream(
    @Param('id') streamId: string,
    @Query('userId') viewerUserId?: string
  ): Promise<StreamDto> {
    return this.liveService.getStream(streamId, viewerUserId);
  }

  @Get('streams/:id/chat')
  async getChatHistory(
    @Param('id') streamId: string,
    @Query('limit') limit?: number
  ): Promise<StreamChatMessageDto[]> {
    return this.liveChatService.getChatHistory(streamId, limit ? Number(limit) : 50);
  }

  @Post('streams/:id/chat')
  @UseGuards(JwtAuthGuard)
  async sendChatMessage(
    @CurrentUser('id') userId: string,
    @Param('id') streamId: string,
    @Body() dto: StreamChatSendRequest
  ): Promise<StreamChatMessageDto> {
    return this.liveChatService.sendMessage(userId, streamId, dto);
  }
}
