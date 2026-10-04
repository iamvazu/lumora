import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  TaxCalculationRequestSchema,
  TaxCalculationResponse,
  ProblemException,
} from '@lumora/contracts';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('tax/calculate')
  calculateTax(@Body() body: any): TaxCalculationResponse {
    const parse = TaxCalculationRequestSchema.safeParse(body);
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
    return this.paymentsService.calculateTax(parse.data);
  }

  @Get('routing/status')
  @UseGuards(JwtAuthGuard)
  getRoutingStatus() {
    return this.paymentsService.getRoutingStatus();
  }
}
