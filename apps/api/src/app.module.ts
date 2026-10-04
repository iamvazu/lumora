import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AccountModule } from './account/account.module.js';
import { AgeModule } from './age/age.module.js';
import { CreatorModule } from './creator/creator.module.js';
import { MediaModule } from './media/media.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { PostsModule } from './posts/posts.module.js';
import { VaultModule } from './vault/vault.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { WalletModule } from './wallet/wallet.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { PurchasesModule } from './purchases/purchases.module.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { PayoutsModule } from './payouts/payouts.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { LiveModule } from './live/live.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
import { ReferralsModule } from './referrals/referrals.module.js';
import { AgenciesModule } from './agencies/agencies.module.js';
import { IdempotencyMiddleware } from './common/middleware/idempotency.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 300, // 300 requests per minute
      },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    AccountModule,
    AgeModule,
    CreatorModule,
    MediaModule,
    ModerationModule,
    PostsModule,
    VaultModule,
    PaymentsModule,
    WalletModule,
    SubscriptionsModule,
    PurchasesModule,
    MessagingModule,
    PayoutsModule,
    NotificationsModule,
    LiveModule,
    AnalyticsModule,
    DiscoveryModule,
    ReferralsModule,
    AgenciesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdempotencyMiddleware).forRoutes('*');
  }
}
