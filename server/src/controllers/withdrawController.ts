import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import z from 'zod';
import config from '@/config';
import { Withdrawal } from '@/generated/prisma/client';

const createWithdrawalSchema = z.object({
  chain: z.enum(config.chains),
  amount: z.number().positive(),
  destinationAddress: z.string().min(10).max(100),
});

class WithdrawalController {
  getUserWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Filters
      const status =
        queryParams.status === 'all'
          ? undefined
          : (queryParams.status as (typeof config.transactionStatuses)[number]);

      const chain = queryParams.chain as
        | (typeof config.chains)[number]
        | undefined;
      if (chain && !config.chains.includes(chain)) {
        return res.status(400).json({ message: 'Invalid chain parameter' });
      }

      const walletAccounts = await prisma.walletAccount.findMany({
        where: { userId, chain },
        select: { id: true },
      });
      const walletAccountIds = walletAccounts.map((account) => account.id);

      const withdrawals = await prisma.withdrawal.findMany({
        where: {
          walletAccountId: { in: walletAccountIds },
          ...(status ? { status } : {}),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ data: withdrawals, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };

  getUserWithdrawalById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const withdrawalId = req.params.id as string;

      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          walletAccount: true,
        },
      });

      if (!withdrawal || withdrawal.walletAccount.userId !== userId) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }

      res.status(200).json(withdrawal);
    } catch (err) {
      next(err);
    }
  };

  createWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const validatedData = createWithdrawalSchema.parse(req.body);

      const walletAccount = await prisma.walletAccount.findFirst({
        where: { chain: validatedData.chain, userId },
        select: { id: true, availableBalance: true },
      });

      if (!walletAccount) {
        return res.status(404).json({ message: 'Wallet not Found' });
      }

      if (walletAccount.availableBalance.lessThan(validatedData.amount)) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }

      let newWithdrawal: Withdrawal | null = null;
      await prisma.$transaction(async (prisma) => {
        await prisma.walletAccount.update({
          where: { id: walletAccount.id },
          data: {
            availableBalance: { decrement: validatedData.amount },
            lockedBalance: { increment: validatedData.amount },
          },
        });

        newWithdrawal = await prisma.withdrawal.create({
          data: {
            walletAccountId: walletAccount.id,
            amount: validatedData.amount,
            destinationAddress: validatedData.destinationAddress,
          },
        });
      });


      res.status(201).json(newWithdrawal);
    } catch (err) {
      next(err);
    }
  };

  cancelWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const withdrawalId = req.params.id as string;
  
      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
      });
  
      if (!withdrawal) {
        throw Object.assign(new Error('Withdrawal not found'), {
          statusCode: 404,
        });
      }
  
      if (withdrawal.status !== 'pending') {
        throw Object.assign(
          new Error('Only pending withdrawals can be cancelled'),
          { statusCode: 400 },
        );
      }
  
      await prisma.$transaction(async (prisma) => {
        await prisma.walletAccount.update({
          where: { id: withdrawal.walletAccountId },
          data: {
            availableBalance: { increment: withdrawal.amount },
            lockedBalance: { decrement: withdrawal.amount },
          },
        });
        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'cancelled' },
        });
      });
  
  
      res.status(200).json({ message: 'Deposit cancelled successfully' });
    } catch (err) {
      next(err);
    }
  };

  // Admin Actions
  getAllWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Filters
      const status =
        queryParams.status === 'all'
          ? undefined
          : (queryParams.status as (typeof config.transactionStatuses)[number]);

      const chain = queryParams.chain as
        | (typeof config.chains)[number]
        | undefined;
      if (chain && !config.chains.includes(chain)) {
        return res.status(400).json({ message: 'Invalid chain parameter' });
      }
      const userId = parseInt(queryParams.userId as string) || undefined;

      const walletAccounts =
        chain || userId
          ? await prisma.walletAccount.findMany({
              where: { chain, userId },
              select: { id: true },
            })
          : null;
      const walletAccountIds = walletAccounts
        ? walletAccounts.map((account) => account.id)
        : undefined;

      const withdrawals = await prisma.withdrawal.findMany({
        where: {
          walletAccountId: { in: walletAccountIds },
          status,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ data: withdrawals, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };

  getWithdrawalById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const withdrawalId = req.params.id as string;

      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          walletAccount: true,
        },
      });

      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }

      res.status(200).json(withdrawal);
    } catch (err) {
      next(err);
    }
  };

  approveWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const withdrawalId = req.params.id as string;

      await prisma.$transaction(async (prisma) => {
        const withdrawal = await prisma.withdrawal.findUnique({
          where: { id: withdrawalId },
        });

        if (!withdrawal) {
          throw Object.assign(new Error('Withdrawal not found'), {
            statusCode: 404,
          });
        }

        if (withdrawal.status !== 'pending') {
          throw Object.assign(
            new Error('Only pending withdrawals can be approved'),
            { statusCode: 400 },
          );
        }

        await prisma.walletAccount.update({
          where: { id: withdrawal.walletAccountId },
          data: {
            lockedBalance: {
              decrement: withdrawal.amount,
            },
          },
        });

        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'approved' },
        });

        await prisma.transaction.create({
          data: {
            walletAccountId: withdrawal.walletAccountId,
            type: 'withdrawal',
            amount: withdrawal.amount,
            actionId: withdrawal.id,
            destinationAddress: withdrawal.destinationAddress,
          },
        });
      });

      res.status(200).json({ message: 'Withdrawal approved successfully' });
    } catch (err) {
      next(err);
    }
  };

  rejectWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const withdrawalId = req.params.id as string;
      const adminNote = req.body.adminNote as string | undefined;

      await prisma.$transaction(async (prisma) => {
        const withdrawal = await prisma.withdrawal.findUnique({
          where: { id: withdrawalId },
        });

        if (!withdrawal) {
          throw Object.assign(new Error('Withdrawal not found'), {
            statusCode: 404,
          });
        }

        if (withdrawal.status !== 'pending') {
          throw Object.assign(
            new Error('Only pending withdrawals can be rejected'),
            { statusCode: 400 },
          );
        }
        await prisma.walletAccount.update({
          where: { id: withdrawal.walletAccountId },
          data: {
            availableBalance: { increment: withdrawal.amount },
            lockedBalance: { decrement: withdrawal.amount },
          },
        });

        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'rejected', adminNote },
        });
      });

      res.status(200).json({ message: 'Withdrawal rejected successfully' });
    } catch (err) {
      next(err);
    }
  };
}

export default new WithdrawalController();
