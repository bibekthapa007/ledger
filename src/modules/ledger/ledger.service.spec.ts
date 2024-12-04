import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  LedgerAccount,
  TransactionType,
  TransactionStatus,
} from '@prisma/client';

import { PrismaService } from 'src/prisma.service';

import { TransactionModal } from './transaction.model';

import { LedgerService } from './ledger.service';

import { CreateTransactionDTO } from './dto/create-transaction.dto';

const mockPrismaService = {
  $transaction: jest.fn(),
};

describe('LedgerService', () => {
  let service: LedgerService;
  let mockTransactionModel: jest.Mocked<TransactionModal>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    // Mock dependencies
    mockTransactionModel = {
      getAll: jest.fn(),
      create: jest.fn(),
      getById: jest.fn(),
      calculateBalance: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<TransactionModal>;

    prismaService = {
      $transaction: jest.fn((callback) => callback({})),
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: PrismaService, useValue: prismaService },
        { provide: TransactionModal, useValue: mockTransactionModel },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
    (service as any).transactionModel = mockTransactionModel; // Inject mocked transactionModel
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllTransaction', () => {
    it('should return all transactions', async () => {
      const transactions = [
        {
          id: '1',
          transactionAmount: 100,
          transactionType: TransactionType.CREDIT,
          ledgerAccount: LedgerAccount.CHECK_IN,
          transactionStatus: TransactionStatus.PENDING,
          createdBy: 1,
          createdAt: new Date(),
          updatedBy: null,
          updatedAt: null,
        },
      ];
      mockTransactionModel.getAll.mockResolvedValue(transactions);

      const result = await service.getAllTransaction();
      expect(result).toEqual(transactions);
    });
  });

  describe('createTransaction', () => {
    it('should throw error if transaction amount is 0 or negative', async () => {
      const transactionBody: CreateTransactionDTO = {
        transactionAmount: 0,
        ledgerAccount: 'CHECK_IN',
        transactionType: 'CREDIT',
      };

      await expect(
        service.createTransaction(transactionBody, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a transaction successfully', async () => {
      const transactionBody: CreateTransactionDTO = {
        transactionAmount: 100,
        ledgerAccount: LedgerAccount.CHECK_IN,
        transactionType: TransactionType.DEBIT,
      };

      const createdTransaction = {
        id: '1',
        transactionAmount: 100,
        transactionType: TransactionType.CREDIT,
        ledgerAccount: LedgerAccount.CHECK_IN,
        transactionStatus: TransactionStatus.PENDING,
        createdBy: 1,
        createdAt: new Date(),
        updatedBy: null,
        updatedAt: null,
      };

      mockPrismaService.$transaction.mockResolvedValue(createdTransaction);
      mockTransactionModel.create.mockResolvedValue(createdTransaction);
      mockTransactionModel.calculateBalance.mockResolvedValue(200);

      const result = await service.createTransaction(transactionBody, 1);
      expect(result).toEqual(createdTransaction);
    });

    it('should throw error if insufficient balance', async () => {
      const transactionBody: CreateTransactionDTO = {
        transactionAmount: 1000,
        ledgerAccount: LedgerAccount.CHECK_IN,
        transactionType: TransactionType.CREDIT,
      };

      mockTransactionModel.calculateBalance.mockResolvedValue(500);

      await expect(
        service.createTransaction(transactionBody, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBalance', () => {
    it('should return balance for a given ledger account', async () => {
      const ledgerAccount = 'CHECK_IN';
      const balance = 1000;
      mockTransactionModel.calculateBalance.mockResolvedValue(balance);

      const result = await service.getBalance(ledgerAccount);
      expect(result).toBe(balance);
    });
  });

  describe('getTransactionStatus', () => {
    it('should return transaction status by ID', async () => {
      const transaction = {
        id: '1',
        transactionAmount: 100,
        transactionType: TransactionType.CREDIT,
        ledgerAccount: LedgerAccount.CHECK_IN,
        transactionStatus: TransactionStatus.PENDING,
        createdBy: 1,
        createdAt: new Date(),
        updatedBy: null,
        updatedAt: null,
      };

      mockTransactionModel.getById.mockResolvedValue(transaction);

      const result = await service.getTransactionStatus('1');
      expect(result).toEqual({ status: TransactionStatus.PENDING });
    });

    it('should throw an error if transaction not found', async () => {
      mockTransactionModel.getById.mockResolvedValue(null);

      await expect(service.getTransactionStatus('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyUpdateStatus', () => {
    it('should throw error if status is the same', async () => {
      await expect(
        service.verifyUpdateStatus('PENDING', 'PENDING'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if status is invalid', async () => {
      await expect(
        service.verifyUpdateStatus(
          TransactionStatus.FULFILLED,
          TransactionStatus.FULFILLED,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status', async () => {
      const transaction = {
        id: '1',
        transactionAmount: 100,
        transactionType: TransactionType.CREDIT,
        ledgerAccount: LedgerAccount.CHECK_IN,
        transactionStatus: TransactionStatus.PENDING,
        createdBy: 1,
        createdAt: new Date(),
        updatedBy: null,
        updatedAt: null,
      };

      const updatedTransaction = {
        ...transaction,
        transactionStatus: TransactionStatus.FULFILLED,
      };

      mockTransactionModel.getById.mockResolvedValue(transaction);
      mockTransactionModel.updateStatus.mockResolvedValue(updatedTransaction);

      const result = await service.updateTransactionStatus(
        '1',
        TransactionStatus.FULFILLED,
        2,
      );
      expect(result.transactionStatus).toBe(TransactionStatus.FULFILLED);
    });

    it('should throw error if transaction not found', async () => {
      mockTransactionModel.getById.mockResolvedValue(null);

      await expect(
        service.updateTransactionStatus('1', TransactionStatus.FULFILLED, 2),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if status cannot be updated to the same status', async () => {
      const transaction = {
        id: '1',
        transactionAmount: 100,
        transactionType: TransactionType.CREDIT,
        ledgerAccount: LedgerAccount.CHECK_IN,
        transactionStatus: TransactionStatus.PENDING,
        createdBy: 1,
        createdAt: new Date(),
        updatedBy: null,
        updatedAt: null,
      };

      mockTransactionModel.getById.mockResolvedValue(transaction);

      await expect(
        service.updateTransactionStatus('1', TransactionStatus.PENDING, 2),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
