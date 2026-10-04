import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProblemException } from '@lumora/contracts';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = any>(err: any, user: any, _info: any, _context: ExecutionContext, _status?: any): TUser {
    if (err || !user) {
      throw (
        err ||
        new ProblemException({
          type: 'https://lumora.app/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          code: 'UNAUTHORIZED',
          detail: 'A valid access token is required to access this resource.',
          requestId: '',
        })
      );
    }
    return user;
  }
}
