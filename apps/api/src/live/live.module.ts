import { Module } from '@nestjs/common';
import { LiveService } from './live.service.js';
import { LiveChatService } from './live-chat.service.js';
import { LiveController } from './live.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { WalletModule } from '../wallet/wallet.module.js';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [LiveController],
  providers: [LiveService, LiveChatService],
  exports: [LiveService, LiveChatService],
})
export class LiveModule {}
