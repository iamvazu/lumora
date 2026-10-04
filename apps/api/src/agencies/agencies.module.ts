import { Module } from '@nestjs/common';
import { AgenciesService } from './agencies.service.js';
import { AgenciesController } from './agencies.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AgenciesController],
  providers: [AgenciesService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
