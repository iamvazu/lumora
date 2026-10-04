import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { PurchasesService } from './purchases.service.js';
import { PurchasesController, TipsController } from './purchases.controller.js';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [PurchasesController, TipsController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
