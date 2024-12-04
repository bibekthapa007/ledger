import {
  Get,
  Req,
  Res,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Controller,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { LedgerAccount, TransactionStatus } from '@prisma/client';

import { LedgerService } from './ledger.service';
import { CreateTransactionDTO } from './dto/create-transaction.dto';

const tempUserId = 1;

@Controller('api/v1/ledgers')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('transactions')
  async getAllTransaction(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<any> {
    const transactions = await this.ledgerService.getAllTransaction();

    return response.status(200).json({
      message: 'Transaction fetched successfully.',
      result: transactions,
    });
  }

  @Post('transactions')
  async postTransaction(
    @Body() transactionBody: CreateTransactionDTO,
    @Res() response: Response,
  ): Promise<any> {
    const transaction = await this.ledgerService.createTransaction(
      transactionBody,
      tempUserId,
    );

    return response.status(201).json({
      message: 'Transaction created successfully.',
      data: transaction,
    });
  }

  @Get('balance')
  async getBalance(
    @Query('ledgerAccount') ledgerAccount: LedgerAccount,
    @Query('date') date: string,
    @Res() response: Response,
  ): Promise<any> {
    const balance = await this.ledgerService.getBalance(ledgerAccount, date);

    return response.status(200).json({
      message: 'Balance fetched successfully.',
      data: balance,
    });
  }

  @Get('transactions/:id/status')
  async getTransactionStatus(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<any> {
    const data = await this.ledgerService.getTransactionStatus(id);

    return response.status(200).json({
      message: 'Transaction status fetched successfully.',
      data,
    });
  }

  @Patch('transactions/:id/status/:transactionStatus')
  async updateTransactionStatus(
    @Param('id') id: string,
    @Param('transactionStatus') transactionStatus: TransactionStatus,
    @Res() response: Response,
  ): Promise<any> {
    const data = await this.ledgerService.updateTransactionStatus(
      id,
      transactionStatus,
      tempUserId,
    );

    return response.status(201).json({
      message: 'Transaction status updated successfully.',
      data,
    });
  }
}
