import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreatePayoutMethodRequest,
  RequestPayoutDto,
  PayoutMethodDto,
  PayoutDto,
  CreatorBalanceDto,
  CreatorStatementDto,
  ProblemException,
} from '@lumora/contracts';
import { LedgerEngine } from '@lumora/ledger';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get creator's balance, maturation holding policy, and payout eligibility (Story E12-1 / E12-2)
   */
  async getCreatorBalance(creatorUserId: string): Promise<CreatorBalanceDto> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      include: {
        creatorBalance: true,
        performers: true,
      },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Payout balances are only available to creator accounts.',
        requestId: '',
      });
    }

    const balance = creator.creatorBalance || {
      pendingCents: 0n,
      availableCents: 0n,
    };

    // Holding days logic: 7 days for creators < 90 days old, 3 days for mature creators (Story E12-1)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const isMature = creator.createdAt <= ninetyDaysAgo;
    const holdingDays = isMature ? 3 : 7;

    // Payout Eligibility Validation (Story E12-2)
    let canRequestPayout = true;
    let payoutBlockReason: string | null = null;

    // 1. Minimum available balance $20 (2000 cents)
    if (balance.availableCents < 2000n) {
      canRequestPayout = false;
      payoutBlockReason = 'Available balance must be at least $20.00 to request payout.';
    }

    // 2. Creator status check
    if (creator.status !== 'approved') {
      canRequestPayout = false;
      payoutBlockReason = 'Creator account KYC verification is pending or incomplete.';
    }

    // 3. Tax profile presence check
    const taxProfile = await this.prisma.taxProfile.findFirst({
      where: { userId: creatorUserId },
    });
    if (!taxProfile) {
      canRequestPayout = false;
      payoutBlockReason = 'A valid Tax Profile (W-9 / W-8BEN) is required before requesting payouts.';
    }

    // 4. P0 moderation freeze check
    const activeP0Case = await this.prisma.moderationCase.findFirst({
      where: {
        id: creator.id,
        priority: 0,
        status: { notIn: ['actioned', 'dismissed'] },
      },
    });
    if (activeP0Case) {
      canRequestPayout = false;
      payoutBlockReason = 'Payouts are frozen pending safety compliance review.';
    }

    return {
      creatorId: creator.id,
      pendingCents: Number(balance.pendingCents),
      availableCents: Number(balance.availableCents),
      currency: 'USD',
      holdingDays,
      nextMaturationAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      canRequestPayout,
      payoutBlockReason,
    };
  }

  /**
   * List payout methods
   */
  async getPayoutMethods(creatorUserId: string): Promise<PayoutMethodDto[]> {
    const methods = await this.prisma.payoutMethod.findMany({
      where: { creatorId: creatorUserId },
      orderBy: { createdAt: 'desc' },
    });

    return methods.map((m) => ({
      id: m.id,
      creatorId: m.creatorId,
      provider: m.provider as any,
      maskedDetails: m.detailsRef ? `••••${m.detailsRef.slice(-4)}` : '••••',
      verifiedAt: m.verifiedAt?.toISOString() || null,
      isDefault: m.isDefault,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  /**
   * Add a new payout method
   */
  async createPayoutMethod(
    creatorUserId: string,
    dto: CreatePayoutMethodRequest,
  ): Promise<PayoutMethodDto> {
    const method = await this.prisma.payoutMethod.create({
      data: {
        creatorId: creatorUserId,
        provider: dto.provider as any,
        detailsRef: JSON.stringify(dto.details),
        verifiedAt: new Date(),
        isDefault: dto.isDefault ?? true,
      },
    });

    return {
      id: method.id,
      creatorId: method.creatorId,
      provider: method.provider as any,
      maskedDetails: '••••',
      verifiedAt: method.verifiedAt?.toISOString() || null,
      isDefault: method.isDefault,
      createdAt: method.createdAt.toISOString(),
    };
  }

  /**
   * Request creator payout with 72h method aging and >$10k manual review flag (Story E12-2)
   */
  async requestPayout(
    creatorUserId: string,
    dto: RequestPayoutDto,
  ): Promise<PayoutDto> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      include: { creatorBalance: true },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Payouts are only available to creator accounts.',
        requestId: '',
      });
    }

    const balance = creator.creatorBalance;
    if (!balance || balance.availableCents < BigInt(dto.amountCents)) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        status: 400,
        code: 'INSUFFICIENT_FUNDS',
        title: 'Insufficient Available Balance',
        detail: `Requested amount ($${(dto.amountCents / 100).toFixed(2)}) exceeds available balance ($${(Number(balance?.availableCents || 0n) / 100).toFixed(2)}).`,
        requestId: '',
      });
    }

    // 72-hour Payout Method Aging Security Check (Story E12-2)
    const method = await this.prisma.payoutMethod.findFirst({
      where: { id: dto.methodId, creatorId: creatorUserId },
    });

    if (!method) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Payout Method Not Found',
        detail: 'The selected payout destination method was not found.',
        requestId: '',
      });
    }

    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 3600 * 1000);
    if (method.createdAt > seventyTwoHoursAgo) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Payout Method Cooldown Active',
        detail: 'Newly added payout methods require a 72-hour holding period for security against unauthorized changes.',
        requestId: '',
      });
    }

    // Flag for manual review if amount > $10,000 (Story E12-2)
    const manualReviewRequired = dto.amountCents >= 1000000;
    const initialStatus = manualReviewRequired ? 'requested' : 'processing';

    // Execute double-entry ledger movement and debit available balance
    const payout = await this.prisma.$transaction(async (tx) => {
      const txId = uuidv7();

      // Find or create ledger accounts
      let creatorAvailableAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'creator', ownerId: creator.id, currency: dto.currency || 'USD' },
      });
      if (!creatorAvailableAcc) {
        creatorAvailableAcc = await tx.ledgerAccount.create({
          data: { ownerType: 'creator', ownerId: creator.id, currency: dto.currency || 'USD' },
        });
      }

      let processorAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'processor', currency: dto.currency || 'USD' },
      });
      if (!processorAcc) {
        processorAcc = await tx.ledgerAccount.create({
          data: { ownerType: 'processor', currency: dto.currency || 'USD' },
        });
      }

      const ledgerTx = LedgerEngine.buildPayoutTransaction({
        transactionId: txId,
        referenceId: txId,
        postedAt: new Date(),
        creatorAvailableAccountId: creatorAvailableAcc.id,
        processorAccountId: processorAcc.id,
        amountCents: BigInt(dto.amountCents),
      });

      await tx.ledgerTransaction.create({
        data: {
          id: txId,
          kind: 'payout_in_transit',
          referenceType: 'payout',
          referenceId: txId,
          entries: {
            create: ledgerTx.entries.map((e) => ({
              accountId: e.accountId,
              amountCents: e.amountCents,
            })),
          },
        },
      });

      // Deduct available balance
      await tx.creatorBalance.update({
        where: { creatorId: creator.id },
        data: { availableCents: { decrement: BigInt(dto.amountCents) } },
      });

      // Create Payout record
      return tx.payout.create({
        data: {
          creatorId: creatorUserId,
          methodId: dto.methodId,
          amountCents: dto.amountCents,
          currency: dto.currency || 'USD',
          status: initialStatus as any,
          providerRef: `payout_${uuidv7().slice(0, 8)}`,
        },
      });
    });

    this.logger.log(`Created payout ${payout.id} for creator ${creator.id} (amount: $${(dto.amountCents / 100).toFixed(2)})`);

    return {
      id: payout.id,
      creatorId: payout.creatorId,
      methodId: payout.methodId,
      provider: method.provider,
      amountCents: payout.amountCents,
      currency: payout.currency,
      status: payout.status as any,
      providerRef: payout.providerRef,
      manualReviewRequired,
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    };
  }

  /**
   * List creator's payout history
   */
  async getPayouts(creatorUserId: string): Promise<PayoutDto[]> {
    const payouts = await this.prisma.payout.findMany({
      where: { creatorId: creatorUserId },
      include: { method: true },
      orderBy: { createdAt: 'desc' },
    });

    return payouts.map((p) => ({
      id: p.id,
      creatorId: p.creatorId,
      methodId: p.methodId,
      provider: p.method.provider,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status as any,
      providerRef: p.providerRef,
      manualReviewRequired: p.amountCents >= 1000000,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  /**
   * Generate monthly earnings statements & tax breakdown (Story E12-3)
   */
  async getStatements(creatorUserId: string, year = 2026): Promise<CreatorStatementDto[]> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creator) return [];

    const taxProfile = await this.prisma.taxProfile.findFirst({
      where: { userId: creatorUserId },
    });

    // Query all succeeded purchases where seller is this creator
    const purchases = await this.prisma.purchase.findMany({
      where: {
        sellerId: creatorUserId,
        status: 'succeeded',
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31T23:59:59`),
        },
      },
    });

    // Group by month
    const monthsMap = new Map<string, { gross: number; fee: number; net: number; count: number }>();

    for (const p of purchases) {
      const monthKey = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const curr = monthsMap.get(monthKey) || { gross: 0, fee: 0, net: 0, count: 0 };
      curr.gross += p.grossCents;
      curr.fee += p.feeCents;
      curr.net += p.netCents;
      curr.count += 1;
      monthsMap.set(monthKey, curr);
    }

    const results: CreatorStatementDto[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${year}-${String(m).padStart(2, '0')}`;
      const data = monthsMap.get(monthKey) || { gross: 0, fee: 0, net: 0, count: 0 };

      results.push({
        period: monthKey,
        grossRevenueCents: data.gross,
        platformFeeCents: data.fee,
        netRevenueCents: data.net,
        refundsCents: 0,
        chargebacksCents: 0,
        payoutsTotalCents: data.net,
        currency: 'USD',
        transactionCount: data.count,
        taxFormType: taxProfile?.formType || 'W-9',
      });
    }

    return results;
  }
}
