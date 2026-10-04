import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memoryCache = new Map<string, { val: string; exp: number }>();

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });
        this.client.connect().catch(() => {
          this.logger.warn('Redis not reachable, falling back to in-memory store for dev/testing.');
          this.client = null;
        });
      } catch {
        this.client = null;
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // fallback to memory cache
      }
    }
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.exp) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.val;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // fallback to memory cache
      }
    }
    const exp = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.memoryCache.set(key, { val: value, exp });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // fallback
      }
    }
    this.memoryCache.delete(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
