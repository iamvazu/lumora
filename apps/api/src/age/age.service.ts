import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProblemException } from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';

export type AgeVerificationMethod = 'id_liveness' | 'facial_estimation' | 'credit_card' | 'age_gate';

export interface RegionAgeRule {
  country: string;
  state?: string;
  requiredMethod: AgeVerificationMethod;
  description: string;
}

@Injectable()
export class AgeService {
  // Region rules matrix (UK Online Safety Act, France, US states: TX, VA, UT, LA)
  private readonly regionRules: RegionAgeRule[] = [
    { country: 'GB', requiredMethod: 'id_liveness', description: 'UK Online Safety Act - Verified ID required' },
    { country: 'FR', requiredMethod: 'id_liveness', description: 'France ARCOM - Mandatory digital ID verification' },
    { country: 'AU', requiredMethod: 'id_liveness', description: 'Australia Online Safety Act' },
    { country: 'US', state: 'TX', requiredMethod: 'id_liveness', description: 'Texas HB 1181 ID verification' },
    { country: 'US', state: 'VA', requiredMethod: 'id_liveness', description: 'Virginia Age Verification Statute' },
    { country: 'US', state: 'UT', requiredMethod: 'id_liveness', description: 'Utah SB 287 Age Verification' },
    { country: 'US', state: 'LA', requiredMethod: 'id_liveness', description: 'Louisiana HB 142 Age Verification' },
  ];

  constructor(
    private prisma: PrismaService
  ) {}

  /**
   * Evaluates the required age verification method based on country and optional state code
   */
  getRequiredMethod(country: string, state?: string): RegionAgeRule {
    const uppercaseCountry = country.toUpperCase();
    const uppercaseState = state?.toUpperCase();

    if (uppercaseState) {
      const stateRule = this.regionRules.find(
        (r) => r.country === uppercaseCountry && r.state === uppercaseState
      );
      if (stateRule) return stateRule;
    }

    const countryRule = this.regionRules.find(
      (r) => r.country === uppercaseCountry && !r.state
    );
    if (countryRule) return countryRule;

    // Default global fallback: Facial age estimation or credit card check
    return {
      country: uppercaseCountry,
      requiredMethod: 'facial_estimation',
      description: 'Standard global age assurance',
    };
  }

  /**
   * Initializes an age verification session with the verification vendor (e.g. Yoti / Veriff)
   */
  async createSession(userId: string, country: string, state?: string) {
    const rule = this.getRequiredMethod(country, state);
    const sessionId = uuidv7();
    const vendorToken = `av_token_${uuidv7()}`;

    // Store pending verification session
    const verification = await this.prisma.verification.create({
      data: {
        id: sessionId,
        subjectUserId: userId,
        provider: 'mock_yoti_av',
        providerRef: vendorToken,
        type: rule.requiredMethod === 'id_liveness' ? 'id_liveness' : 'age_estimate',
        status: 'pending',
      },
    });

    return {
      sessionId: verification.id,
      vendorToken,
      requiredMethod: rule.requiredMethod,
      jurisdictionNotice: rule.description,
      verificationUrl: `https://verify.lumora.app/session/${vendorToken}`,
    };
  }

  /**
   * Gets current user age verification status
   */
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        ageVerifiedAt: true,
        ageVerificationMethod: true,
        country: true,
      },
    });

    if (!user) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'User Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'User not found.',
        requestId: '',
      });
    }

    const rule = this.getRequiredMethod(user.country);

    return {
      isAgeVerified: !!user.ageVerifiedAt,
      verifiedAt: user.ageVerifiedAt ? user.ageVerifiedAt.toISOString() : null,
      method: user.ageVerificationMethod,
      requiredMethod: rule.requiredMethod,
      jurisdictionNotice: rule.description,
    };
  }

  /**
   * Completes age verification (invoked by vendor webhook or mock in test/dev)
   */
  async completeVerification(sessionId: string, isAdult: boolean, estimatedAge?: number) {
    const verification = await this.prisma.verification.findUnique({
      where: { id: sessionId },
    });

    if (!verification || !verification.subjectUserId) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Verification Session Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Verification session not found.',
        requestId: '',
      });
    }

    if (!isAdult || (estimatedAge !== undefined && estimatedAge < 18)) {
      await this.prisma.verification.update({
        where: { id: sessionId },
        data: {
          status: 'rejected',
          resultJson: { isAdult: false, estimatedAge, reason: 'UNDERAGE_DETECTED' },
        },
      });

      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: 'Age Verification Failed',
        status: 403,
        code: 'AGE_VERIFICATION_REQUIRED',
        detail: 'Age verification failed: you must be at least 18 years old to access adult content.',
        requestId: '',
      });
    }

    await this.prisma.$transaction([
      this.prisma.verification.update({
        where: { id: sessionId },
        data: {
          status: 'approved',
          resultJson: { isAdult: true, estimatedAge },
        },
      }),
      this.prisma.user.update({
        where: { id: verification.subjectUserId },
        data: {
          ageVerifiedAt: new Date(),
          ageVerificationMethod: verification.type,
        },
      }),
    ]);

    return { success: true, isAgeVerified: true };
  }
}
