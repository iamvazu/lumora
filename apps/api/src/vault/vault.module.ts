import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { VaultService } from './vault.service.js';
import { VaultController } from './vault.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [VaultController],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule {}
