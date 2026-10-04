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
  const app = await NestFactory.createApplicationContext(WorkerModule);
  logger.log('Lumora Background Worker started');

  const rebill = app.get(SubscriptionRebillProcessor);
  const massMsg = app.get(MassMessageProcessor);
  const maturation = app.get(BalanceMaturationProcessor);

  const runTick = async () => {
    try {
      await rebill.processDueSubscriptions();
      await massMsg.processPendingMassMessages();
      await maturation.processMaturingBalances();
    } catch (err: any) {
      logger.error(`Worker periodic cycle failed: ${err.message}`);
    }
  };

  // Run initial tick, then run every 60 seconds
  await runTick();
  setInterval(runTick, 60000);
}

bootstrap();

