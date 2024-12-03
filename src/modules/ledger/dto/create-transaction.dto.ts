import { LedgerAccount, TransactionType } from '@prisma/client';
import { IsNumber, IsEnum, IsString, IsPositive } from 'class-validator';

export class CreateTransactionDTO {
  @IsNumber()
  @IsPositive()
  transactionAmount: number;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsString()
  ledgerAccount: LedgerAccount;

  @IsString()
  createdBy: string;
}
