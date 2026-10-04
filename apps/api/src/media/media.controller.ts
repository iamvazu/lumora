import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MediaService } from './media.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { MediaUploadRequestSchema, ProblemException } from '@lumora/contracts';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('uploads')
  @HttpCode(HttpStatus.CREATED)
  async createUploadUrl(@CurrentUser('id') userId: string, @Body() body: any) {
    const parse = MediaUploadRequestSchema.safeParse(body);
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
    return this.mediaService.createUploadUrl(userId, parse.data);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @CurrentUser('id') userId: string,
    @Param('id') mediaId: string,
    @Body('sha256') sha256?: string
  ) {
    return this.mediaService.completeUpload(userId, mediaId, sha256);
  }

  @Get(':id/playback')
  async getPlaybackUrl(
    @CurrentUser('id') userId: string,
    @Param('id') mediaId: string
  ) {
    return this.mediaService.getPlaybackUrl(userId, mediaId);
  }
}
