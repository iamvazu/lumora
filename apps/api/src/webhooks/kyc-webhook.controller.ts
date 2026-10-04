import { Controller, Post, Param, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CreatorService } from '../creator/creator.service.js';

@Controller('webhooks/kyc')
export class KycWebhookController {
  private readonly logger = new Logger(KycWebhookController.name);

  constructor(private creatorService: CreatorService) {}

  @Post(':name')
  @HttpCode(HttpStatus.OK)
  async handleKycWebhook(
    @Param('name') providerName: string,
    @Headers('x-signature') signature: string,
    @Body() payload: any
  ) {
    this.logger.log(`Received KYC webhook from ${providerName} (signature: ${signature || 'none'})`);

    const vendorRef = payload?.vendorRef || payload?.verificationId || payload?.id;
    const status = payload?.status === 'approved' ? 'approved' : 'rejected';
    const score = typeof payload?.score === 'number' ? payload.score : 0.95;
    const age = typeof payload?.age === 'number' ? payload.age : 21;
    const docMatch = payload?.docMatch !== false;
    const sanctionsHit = payload?.sanctionsHit === true;

    return this.creatorService.processKycWebhook(vendorRef, {
      status,
      score,
      age,
      docMatch,
      sanctionsHit,
    });
  }
}
