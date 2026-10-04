import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../redis/redis.service.js';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(private redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return next();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;
    const cachedResponse = await this.redisService.get(cacheKey);

    if (cachedResponse) {
      try {
        const parsed = JSON.parse(cachedResponse);
        res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
        return res.status(parsed.status).json(parsed.body);
      } catch {
        // Continue if parse fails
      }
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        this.redisService.set(
          cacheKey,
          JSON.stringify({
            status: res.statusCode,
            body,
          }),
          86400 // 24 hours
        );
      }
      return originalJson(body);
    };

    next();
  }
}
