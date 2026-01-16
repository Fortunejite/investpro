import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import config from '@/config';
import { TransactionType } from '@prisma/client';

class TransactionController {
  getUserTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Filters
      const type =
        queryParams.type === 'all'
          ? undefined
          : (queryParams.type as TransactionType);
      if (type && !config.transactionTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid type parameter' });
      }
      const transactions = await prisma.transaction.findMany({
        where: {
          accountId: userId,
          ...(type ? { type } : {}),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ data: transactions, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };

  getUserTransactionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id as string;

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          account: true,
        },
      });

      if (!transaction || transaction.account.id !== userId) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      res.status(200).json(transaction);
    } catch (err) {
      next(err);
    }
  };

  // Admin Actions
  getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Filters
      const type =
        queryParams.type === 'all'
          ? undefined
          : (queryParams.type as TransactionType);

      if (type && !config.transactionTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid type parameter' });
      }

      const userId = parseInt(queryParams.userId as string) || undefined;
      const transactions = await prisma.transaction.findMany({
        where: {
          accountId: userId,
          type,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ data: transactions, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };

  getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transactionId = req.params.id as string;

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          account: true,
        },
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      res.status(200).json(transaction);
    } catch (err) {
      next(err);
    }
  };
}

export default new TransactionController();
