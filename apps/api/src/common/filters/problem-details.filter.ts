import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ProblemDetails, ProblemException } from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv7();

    let problem: ProblemDetails;

    if (exception instanceof ProblemException) {
      problem = {
        ...exception.problem,
        requestId,
      };
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      let detail = exception.message;
      let invalidParams: { name: string; reason: string }[] | undefined = undefined;

      if (typeof res === 'object' && res !== null) {
        const anyRes = res as Record<string, any>;
        const msg = anyRes['message'];
        if (Array.isArray(msg)) {
          detail = msg.join('; ');
          invalidParams = msg.map((m: string) => ({
            name: 'body',
            reason: m,
          }));
        } else if (typeof msg === 'string') {
          detail = msg;
        }
      }

      problem = {
        type: `https://lumora.app/errors/${status}`,
        title: exception.name || 'HTTP Error',
        status,
        code: this.mapStatusToCode(status),
        detail,
        requestId,
        invalidParams,
      };
    } else {
      this.logger.error('Unhandled Internal Exception', exception);
      problem = {
        type: 'https://lumora.app/errors/500',
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        detail: 'An unexpected internal error occurred.',
        requestId,
      };
    }

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(problem.status).json(problem);
  }

  private mapStatusToCode(status: number): any {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
