import {
  Prisma,
  Transaction,
  PrismaClient,
  LedgerAccount,
  TransactionType,
  TransactionStatus,
} from '@prisma/client';
import { CreateTransactionDTO } from './dto/create-transaction.dto';

/**
 * Represents a financial transaction.
 */
export class TransactionModal {
  private prisma: PrismaClient;
  private tableName = 'transactions';

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Retrieves all transactions.
   *
   * @returns A promise resolving to a list of transactions.
   */
  async getAll(): Promise<Transaction[]> {
    return this.prisma.transaction.findMany();
  }

  /**
   * Fetch the transaction status for a given transaction ID.
   *
   * @param transactionId - The unique identifier of the transaction.
   * @returns A promise resolving to the transaction object if found, or `null` if not found.
   */
  async getById(transactionId: string): Promise<Transaction> {
    return this.prisma.transaction.findUnique({ where: { id: transactionId } });
  }

  /**
   * Creates a new transaction.
   *
   * @param data - The transaction data.
   * @param createdBy - ID of the user creating the transaction.
   * @returns A promise resolving to the created transaction.
   */
  async create(
    data: CreateTransactionDTO,
    createdBy: number,
    trx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const transactionClient = trx || this.prisma;

    return transactionClient.transaction.create({
      data: {
        id: data.transactionAmount.toString(),
        transactionAmount: data.transactionAmount,
        transactionType: data.transactionType,
        ledgerAccount: data.ledgerAccount,
        transactionStatus: TransactionStatus.PENDING,
        createdBy,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Calculates the balance based on the transaction type.
   *
   * @param ledgerAccount - Ledger account type (CHECK_IN or PAYABLE).
   * @param date - The date for balance calculation.
   * @returns The calculated balance.
   */
  async calculateBalance(
    ledgerAccount: LedgerAccount,
    date?: string | Date,
    trx?: Prisma.TransactionClient,
  ): Promise<number> {
    const filterDate = date || new Date().toISOString();

    const result = await (trx || this.prisma).transaction.groupBy({
      by: ['transactionType'],
      _sum: {
        transactionAmount: true,
      },
      where: {
        ledgerAccount,
        createdAt: {
          lte: filterDate,
        },
        transactionStatus: TransactionStatus.FULFILLED,
      },
    });

    const totalCredit =
      result.find((item) => item.transactionType === TransactionType.CREDIT)
        ?._sum.transactionAmount ?? 0;

    const totalDebit =
      result.find((item) => item.transactionType === TransactionType.DEBIT)
        ?._sum.transactionAmount ?? 0;

    return totalDebit - totalCredit;
  }

  /**
   * Updates the status of a transaction to FULFILLED.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param transactionStatus - The transaction status to update.
   * @param updatedBy - The ID of the user updating the transaction.
   * @returns A promise resolving to the updated transaction.
   */
  async updateStatus(
    transactionId: string,
    transactionStatus: TransactionStatus,
    updatedBy: number,
  ): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        transactionStatus,
        updatedBy,
        updatedAt: new Date(),
      },
    });
  }
}
