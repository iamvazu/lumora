import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreatorService } from './creator.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  ApplyCreatorRequestSchema,
  TaxProfileRequestSchema,
  UpdateCreatorProfileRequestSchema,
  ProblemException,
} from '@lumora/contracts';

@Controller('creator')
@UseGuards(JwtAuthGuard)
export class CreatorController {
  constructor(private creatorService: CreatorService) {}

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  async apply(@CurrentUser('id') userId: string, @Body() body: any) {
    const parse = ApplyCreatorRequestSchema.safeParse(body);
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
    return this.creatorService.apply(userId, parse.data);
  }

  @Post('kyc/session')
  @HttpCode(HttpStatus.CREATED)
  async createKycSession(@CurrentUser('id') userId: string) {
    return this.creatorService.createKycSession(userId);
  }

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.creatorService.getStatus(userId);
  }

  @Patch('profile')
  async updateProfile(@CurrentUser('id') userId: string, @Body() body: any) {
    const parse = UpdateCreatorProfileRequestSchema.safeParse(body);
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
    return this.creatorService.updateProfile(userId, parse.data);
  }

  @Put('tax-profile')
  async submitTaxProfile(@CurrentUser('id') userId: string, @Body() body: any) {
    const parse = TaxProfileRequestSchema.safeParse(body);
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
    return this.creatorService.submitTaxProfile(userId, parse.data);
  }
}
