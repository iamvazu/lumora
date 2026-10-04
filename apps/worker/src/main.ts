import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SubscriptionRebillProcessor } from './processors/subscription-rebill.processor.js';
import { MassMessageProcessor } from './processors/mass-message.processor.js';
import { BalanceMaturationProcessor } from './processors/balance-maturation.processor.js';
import { StreamModerationProcessor } from './processors/stream-moderation.processor.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [
    SubscriptionRebillProcessor,
    MassMessageProcessor,
    BalanceMaturationProcessor,
    StreamModerationProcessor,
  ],
})
class WorkerModule {}

async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');
  await NestFactory.createApplicationContext(WorkerModule);
  logger.log('Lumora Background Worker started');
}

bootstrap();
