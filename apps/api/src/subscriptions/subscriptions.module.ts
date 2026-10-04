import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { CreatorPlansController, CreatorPromotionsController } from './creator-plans.controller.js';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [SubscriptionsController, CreatorPlansController, CreatorPromotionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
