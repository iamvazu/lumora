import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CreatorService } from './creator.service.js';
import { CreatorController } from './creator.controller.js';
import { PublicCreatorsController } from './public-creators.controller.js';
import { PerformersService } from './performers.service.js';
import { PerformersController } from './performers.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [CreatorController, PublicCreatorsController, PerformersController],
  providers: [CreatorService, PerformersService],
  exports: [CreatorService, PerformersService],
})
export class CreatorModule {}
