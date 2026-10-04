import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProblemException } from '@lumora/contracts';

@Injectable()
export class AgeVerificationGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'UNAUTHORIZED',
        detail: 'Authentication is required before performing age verification.',
        requestId: '',
      });
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { ageVerifiedAt: true },
    });

    if (!dbUser || !dbUser.ageVerifiedAt) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/age-verification-required',
        title: 'Age Verification Required',
        status: 403,
        code: 'AGE_VERIFICATION_REQUIRED',
        detail: 'You must complete 18+ age verification before accessing or purchasing explicit creator content.',
        requestId: '',
      });
    }

    return true;
  }
}
