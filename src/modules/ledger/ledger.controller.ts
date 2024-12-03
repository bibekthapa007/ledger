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

import { LedgerAccount } from '@prisma/client';

import { LedgerService } from './ledger.service';
import { CreateTransactionDTO } from './dto/create-transaction.dto';

const tempUserId = 1;

@Controller('api/v1/ledgers')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
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
    const transaction = this.ledgerService.createTransaction(
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
    const balance = this.ledgerService.getBalance(ledgerAccount, date);

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
    const data = this.ledgerService.getTransactionStatus(id);

    return response.status(200).json({
      message: 'Transaction status fetched successfully.',
      data,
    });
  }

  @Patch('transaction/:id/status/statusType')
  async updateTransactionStatus(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<any> {
    const data = this.ledgerService.updateTransactionStatus(id, tempUserId);

    return response.status(201).json({
      message: 'Transaction status updated successfully.',
      data,
    });
  }
}
