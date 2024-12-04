import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';

import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { TransactionModal } from './transaction.model';

@Module({
  controllers: [LedgerController],
  providers: [LedgerService, PrismaService, PrismaClient, TransactionModal],
  exports: [LedgerService, TransactionModal],
})
export class LedgerModule {}
