import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import {
  Prisma,
  Transaction,
  LedgerAccount,
  TransactionType,
  TransactionStatus,
} from '@prisma/client';

import { getDate } from 'src/utils/date';

import { PrismaService } from 'src/prisma.service';

import { TransactionModal } from './transaction.model';
import { CreateTransactionDTO } from './dto/create-transaction.dto';

@Injectable()
export class LedgerService {
  logger: Logger;
  private readonly transactionModel: TransactionModal;

  constructor(
    private prisma: PrismaService,
    transactionModel: TransactionModal,
  ) {
    this.logger = new Logger('LedgerService');
    this.transactionModel = transactionModel;
  }

  async getAllTransaction(): Promise<Transaction[]> {
    this.logger.log('Fetching all transactions.');

    return this.transactionModel.getAll();
  }

  /**
   * Create a transaction
   *
   * @param transactionBody - The transaction body
   * @param createdBy - ID of the user creating the transaction
   */
  async createTransaction(
    transactionBody: CreateTransactionDTO,
    createdBy: number,
  ) {
    this.logger.log(`Creating the transaction by user: ${createdBy}.`);

    const { transactionAmount, ledgerAccount, transactionType } =
      transactionBody;

    if (transactionAmount <= 0) {
      throw new BadRequestException(
        'Transaction amount must be greater than zero.',
      );
    }

    return await this.prisma.$transaction(async (trx) => {
      await trx.$executeRaw`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;`;

      const balance = await this.getBalance(ledgerAccount, null, trx);

      const currentAmount = balance - transactionAmount;

      if (transactionType === TransactionType.CREDIT && currentAmount < 0) {
        throw new BadRequestException('Insufficient balance.');
      }

      const newTransaction = await this.transactionModel.create(
        transactionBody,
        createdBy,
        trx,
      );

      return newTransaction;
    });
  }

  /**
   * Get the current balance of a ledger account at a given point in time
   *
   * @param ledgerAccount - Ledger account type (CHECK_IN or PAYABLE)
   * @param date - The date for balance calculation
   */
  async getBalance(
    ledgerAccount: LedgerAccount,
    date?: string,
    trx?: Prisma.TransactionClient,
  ): Promise<number> {
    const filterDate = date || getDate();

    this.logger.log(`Calculating balance for ledger account: ${ledgerAccount}`);

    return await this.transactionModel.calculateBalance(
      ledgerAccount,
      filterDate,
      trx,
    );
  }

  /**
   * Fetch the transaction status for a given transaction ID.
   *
   * @param {string} id - The unique identifier of the transaction.
   * @returns {Promise<Transaction | null>} - A promise resolving to the transaction object if found, or `null` if not found.
   */
  async getTransactionStatus(
    id: string,
  ): Promise<{ status: TransactionStatus } | null> {
    const transaction = await this.transactionModel.getById(id);

    if (!transaction) {
      throw new BadRequestException(`Transaction with id: ${id} not found.`);
    }

    return { status: transaction.transactionStatus };
  }

  /**
   * Verify and validate transaction status update.
   *
   * @param transactionStatus - The current transaction status.
   * @param newTransactionStatus - The new transaction status to update to.
   * @throws BadRequestException if the status is invalid or remains the same.
   */
  async verifyUpdateStatus(
    transactionStatus: TransactionStatus,
    newTransactionStatus: TransactionStatus,
  ) {
    if (transactionStatus === newTransactionStatus) {
      throw new BadRequestException(
        `Transaction can't be updated to same status.`,
      );
    }

    if (transactionStatus !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        `Invalid transaction status update requested.`,
      );
    }
  }

  /**
   * Update the status of a transaction.
   *
   * @param {string} id - The unique identifier of the transaction to update.
   * @param {number} transactionStatus - The transactionStatus to update.
   * @param {number} updatedBy - The ID of the user making the update.
   * @returns {Promise<Transaction>} - A promise resolving to the updated transaction object.
   */
  async updateTransactionStatus(
    id: string,
    transactionStatus: TransactionStatus,
    updatedBy: number,
  ): Promise<Transaction> {
    this.logger.log(`Updating the transaction: ${id} by user: ${updatedBy}.`);

    const transaction = await this.transactionModel.getById(id);

    if (!transaction) {
      throw new BadRequestException(`Transaction with id: ${id} not found.`);
    }

    await this.verifyUpdateStatus(
      transaction.transactionStatus,
      transactionStatus,
    );

    return this.transactionModel.updateStatus(id, transactionStatus, updatedBy);
  }
}
