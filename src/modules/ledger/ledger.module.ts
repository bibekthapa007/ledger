import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';

import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';

@Module({
  controllers: [LedgerController],
  providers: [LedgerService, PrismaService],
})
export class LedgerModule {}
