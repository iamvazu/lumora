import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgenciesService } from './agencies.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CreateAgencyRequest,
  AgencyDto,
  InviteCreatorRequest,
  AgencyCreatorDto,
  AddAgencyMemberRequest,
  AgencyMemberDto,
  AgencyEarningsSummaryDto,
} from '@lumora/contracts';
import type { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class AgenciesController {
  constructor(private agenciesService: AgenciesService) {}

  @Post('agencies')
  async createAgency(
    @Req() req: Request,
    @Body() dto: CreateAgencyRequest
  ): Promise<AgencyDto> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.createAgency(userId, dto);
  }

  @Get('agencies/me')
  async getMyAgency(@Req() req: Request): Promise<AgencyDto> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.getAgency(userId);
  }

  @Get('agencies/:id')
  async getAgency(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<AgencyDto> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.getAgency(userId, id);
  }

  @Post('agencies/:id/invites')
  async inviteCreator(
    @Req() req: Request,
    @Param('id') agencyId: string,
    @Body() dto: InviteCreatorRequest
  ): Promise<AgencyCreatorDto> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.inviteCreator(userId, agencyId, dto);
  }

  @Post('creator/agency-invites/:id/accept')
  async acceptInvitation(
    @Req() req: Request,
    @Param('id') inviteId: string
  ): Promise<AgencyCreatorDto> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.acceptInvitation(userId, inviteId);
  }

  @Get('agencies/:id/creators')
  async getAgencyCreators(
    @Req() req: Request,
    @Param('id') agencyId: string
  ): Promise<AgencyCreatorDto[]> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.getAgencyCreators(userId, agencyId);
  }

  @Post('agencies/:id/members')
  async addMember(
    @Req() req: Request,
    @Param('id') agencyId: string,
    @Body() dto: AddAgencyMemberRequest
  ): Promise<AgencyMemberDto> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.addMember(userId, agencyId, dto);
  }

  @Delete('agencies/:id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Req() req: Request,
    @Param('id') agencyId: string,
    @Param('userId') targetUserId: string
  ): Promise<void> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.removeMember(userId, agencyId, targetUserId);
  }

  @Get('agencies/:id/earnings')
  async getEarnings(
    @Req() req: Request,
    @Param('id') agencyId: string
  ): Promise<AgencyEarningsSummaryDto> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.agenciesService.getEarnings(userId, agencyId);
  }
}
