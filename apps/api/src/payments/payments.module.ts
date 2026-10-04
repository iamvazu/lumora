import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { MockCCBillProvider } from './mock-ccbill.provider.js';
import { MockSegpayProvider } from './mock-segpay.provider.js';
import { ProcessorRouterService } from './processor-router.service.js';
import { VatTaxService } from './vat-tax.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockCCBillProvider,
    MockSegpayProvider,
    ProcessorRouterService,
    VatTaxService,
  ],
  exports: [PaymentsService, ProcessorRouterService, VatTaxService],
})
export class PaymentsModule {}
