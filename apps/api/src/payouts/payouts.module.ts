import { Module } from '@nestjs/common';
import { PayoutsService } from './payouts.service.js';
import { PayoutsController } from './payouts.controller.js';

@Module({
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
