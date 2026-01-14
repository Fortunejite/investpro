import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import z from 'zod';
import config from '@/config';

const createDepositSchema = z.object({
  chain: z.enum(config.chains),
  amount: z.number().positive(),
  txHash: z.string().min(10).max(100).optional(),
  proofUrl: z.url().optional(),
});

class DepositController {
  getUserDeposits = async (req: Request, res: Response, next: NextFunction) => {
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

      const deposits = await prisma.deposit.findMany({
        where: {
          walletAccountId: { in: walletAccountIds },
          ...(status ? { status } : {}),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ data: deposits, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };

  getUserDepositById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const depositId = req.params.id as string;

      const deposit = await prisma.deposit.findUnique({
        where: { id: depositId },
        include: {
          walletAccount: true,
        },
      });

      if (!deposit || deposit.walletAccount.userId !== userId) {
        return res.status(404).json({ message: 'Deposit not found' });
      }

      res.status(200).json(deposit);
    } catch (err) {
      next(err);
    }
  };

  createDeposit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const validatedData = createDepositSchema.parse(req.body);

      const walletAccount = await prisma.walletAccount.findFirst({
        where: { chain: validatedData.chain, userId },
        select: { id: true },
      });

      if (!walletAccount) {
        return res.status(404).json({ message: 'Wallet not Found' });
      }

      const newDeposit = await prisma.deposit.create({
        data: {
          walletAccountId: walletAccount.id,
          amount: validatedData.amount,
          txHash: validatedData.txHash,
          proofUrl: validatedData.proofUrl,
        },
      });

      res.status(201).json(newDeposit);
    } catch (err) {
      next(err);
    }
  };

  // Admin Actions
  getAllDeposits = async (req: Request, res: Response, next: NextFunction) => {
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

      const deposits = await prisma.deposit.findMany({
        where: {
          walletAccountId: { in: walletAccountIds },
          status,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ data: deposits, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };

  getDepositById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const depositId = req.params.id as string;

      const deposit = await prisma.deposit.findUnique({
        where: { id: depositId },
        include: {
          walletAccount: true,
        },
      });

      if (!deposit) {
        return res.status(404).json({ message: 'Deposit not found' });
      }

      res.status(200).json(deposit);
    } catch (err) {
      next(err);
    }
  };

  approveDeposit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const depositId = req.params.id as string;

      await prisma.$transaction(async (prisma) => {
        const deposit = await prisma.deposit.findUnique({
          where: { id: depositId },
        });

        if (!deposit) {
          throw Object.assign(new Error('Deposit not found'), {
            statusCode: 404,
          });
        }

        if (deposit.status !== 'pending') {
          throw Object.assign(
            new Error('Only pending deposits can be approved'),
            { statusCode: 400 },
          );
        }

        // Update user's balance
        const walletAccount = await prisma.walletAccount.findUnique({
          where: { id: deposit.walletAccountId },
        });

        if (!walletAccount) {
          throw Object.assign(new Error('Wallet account not found'), {
            statusCode: 404,
          });
        }

        await prisma.walletAccount.update({
          where: { id: walletAccount.id },
          data: {
            availableBalance: {
              increment: deposit.amount,
            },
          },
        });

        await prisma.deposit.update({
          where: { id: depositId },
          data: { status: 'approved' },
        });

        await prisma.transaction.create({
          data: {
            walletAccountId: walletAccount.id,
            type: 'deposit',
            amount: deposit.amount,
            actionId: deposit.id,
            txHash: deposit.txHash,
          },
        });
      });

      res.status(200).json({ message: 'Deposit approved successfully' });
    } catch (err) {
      next(err);
    }
  };

  rejectDeposit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const depositId = req.params.id as string;
      const adminNote = req.body.adminNote as string | undefined;

      await prisma.$transaction(async (prisma) => {
        const deposit = await prisma.deposit.findUnique({
          where: { id: depositId },
        });

        if (!deposit) {
          throw Object.assign(new Error('Deposit not found'), {
            statusCode: 404,
          });
        }

        if (deposit.status !== 'pending') {
          throw Object.assign(
            new Error('Only pending deposits can be rejected'),
            { statusCode: 400 },
          );
        }

        await prisma.deposit.update({
          where: { id: depositId },
          data: { status: 'rejected', adminNote },
        });
      });

      res.status(200).json({ message: 'Deposit rejected successfully' });
    } catch (err) {
      next(err);
    }
  };
}

export default new DepositController();
