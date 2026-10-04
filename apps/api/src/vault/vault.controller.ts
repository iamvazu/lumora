import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VaultService } from './vault.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CreateVaultFolderRequestSchema,
  AddVaultItemRequestSchema,
  UpdateVaultItemRequestSchema,
  ProblemException,
} from '@lumora/contracts';
import type { Request } from 'express';

@Controller('vault')
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get('folders')
  async getFolders(@Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.vaultService.getFolders(userId);
  }

  @Post('folders')
  @HttpCode(HttpStatus.CREATED)
  async createFolder(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = CreateVaultFolderRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: parse.error.errors.map((e) => e.message).join('; '),
        requestId: '',
      });
    }
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.vaultService.createFolder(userId, parse.data);
  }

  @Delete('folders/:id')
  @HttpCode(HttpStatus.OK)
  async deleteFolder(@Param('id') folderId: string, @Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.vaultService.deleteFolder(userId, folderId);
  }

  @Get('items')
  async getVaultItems(
    @Query('folderId') folderId: string | undefined,
    @Query('tag') tag: string | undefined,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.vaultService.getVaultItems(userId, folderId, tag);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  async addVaultItem(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = AddVaultItemRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: parse.error.errors.map((e) => e.message).join('; '),
        requestId: '',
      });
    }
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.vaultService.addVaultItem(userId, parse.data);
  }

  @Patch('items/:id')
  @HttpCode(HttpStatus.OK)
  async updateVaultItem(
    @Param('id') itemId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = UpdateVaultItemRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: parse.error.errors.map((e) => e.message).join('; '),
        requestId: '',
      });
    }
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.vaultService.updateVaultItem(userId, itemId, parse.data);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  async deleteVaultItem(@Param('id') itemId: string, @Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.vaultService.deleteVaultItem(userId, itemId);
  }
}
