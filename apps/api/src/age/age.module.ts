import { Module } from '@nestjs/common';
import { AgeController } from './age.controller.js';
import { AgeService } from './age.service.js';

@Module({
  controllers: [AgeController],
  providers: [AgeService],
  exports: [AgeService],
})
export class AgeModule {}
