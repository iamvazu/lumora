import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagingService } from './messaging.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  SendMessageRequest,
  MassMessageRequest,
  MessageDto,
  ConversationDto,
  MassMessageDto,
} from '@lumora/contracts';

@Controller('v1')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  async getConversations(@Request() req: any): Promise<ConversationDto[]> {
    return this.messagingService.getConversations(req.user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ): Promise<MessageDto[]> {
    return this.messagingService.getMessages(
      req.user.id,
      id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageRequest,
  ): Promise<MessageDto> {
    return this.messagingService.sendMessage(req.user.id, id, dto);
  }

  @Post('conversations/:id/read')
  async markAsRead(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.messagingService.markAsRead(req.user.id, id);
  }

  @Post('creator/mass-messages')
  async createMassMessage(
    @Request() req: any,
    @Body() dto: MassMessageRequest,
  ): Promise<MassMessageDto> {
    return this.messagingService.createMassMessage(req.user.id, dto);
  }
}
