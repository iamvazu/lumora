import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ModerationService } from './moderation.service.js';
import { ModerationController } from './moderation.controller.js';
import { AdminModerationController } from './admin-moderation.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [ModerationController, AdminModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
