import { Request, Response, NextFunction } from 'express';
import { Chain, TransactionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import z from 'zod';
import config from '@/config';
import { getPriceInUsd } from '@/services/price';

const createDepositSchema = z.object({
  chain: z.enum(config.chains),
  amount: z.number().positive(),
  txHash: z.string().max(100).optional(),
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
      const chain = queryParams.chain as Chain;
      if (chain && !config.chains.includes(chain)) {
        return res.status(400).json({ message: 'Invalid chain parameter' });
      }

      const status =
        queryParams.status === 'all'
          ? undefined
          : (queryParams.status as TransactionStatus);

      if (status && !config.transactionStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status parameter' });
      }

      const where = {
          accountId: userId,
          ...(status ? { status } : {}),
          ...(chain ? { chain } : {}),
        }
      const [deposits, totalCount] = await Promise.all([
        await prisma.deposit.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        await prisma.deposit.count({ where }),
      ]);
      res.status(200).json({ data: deposits, pagination: { page, limit, total: totalCount } });
    } catch (err) {
      next(err);
    }
  };

  getUserDepositById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user.id;
      const depositId = req.params.id as string;

      const deposit = await prisma.deposit.findUnique({
        where: { id: depositId },
        include: {
          account: true,
        },
      });

      if (!deposit || deposit.account.id !== userId) {
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

      const perUsdRate = await getPriceInUsd(validatedData.chain);
      if (!perUsdRate) {
        return res.status(500).json({ message: 'Failed to fetch price data' });
      }

      const newDeposit = await prisma.deposit.create({
        data: {
          accountId: userId,
          amount: validatedData.amount,
          perUsdRate,
          chain: validatedData.chain,
          txHash: validatedData.txHash,
          proofUrl: validatedData.proofUrl,
        },
      });

      res.status(201).json(newDeposit);
    } catch (err) {
      next(err);
    }
  };

  cancelDeposit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const depositId = req.params.id as string;

      const deposit = await prisma.deposit.findUnique({
        where: { id: depositId },
      });

      if (!deposit || deposit.accountId !== userId) {
        throw Object.assign(new Error('Deposit not found'), {
          status: 404,
        });
      }

      if (deposit.status !== 'pending') {
        throw Object.assign(
          new Error('Only pending deposits can be cancelled'),
          { status: 400 },
        );
      }

      await prisma.deposit.update({
        where: { id: depositId },
        data: { status: 'cancelled' },
      });

      res.status(200).json({ message: 'Deposit cancelled successfully' });
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
      const chain = queryParams.chain as Chain;
      if (chain && !config.chains.includes(chain)) {
        return res.status(400).json({ message: 'Invalid chain parameter' });
      }
      const status =
        queryParams.status === 'all'
          ? undefined
          : (queryParams.status as (typeof config.transactionStatuses)[number]);

      const userId = parseInt(queryParams.userId as string) || undefined;
      const where = {
        accountId: userId,
        status,
        ...(chain ? { chain } : {}),
      };
      const [deposits, totalCount] = await Promise.all([
        await prisma.deposit.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            account: {
              include: {
                user: true,
              },
            },
          },
        }),
        await prisma.deposit.count({ where }),
      ]);
      res.status(200).json({
        data: deposits,
        pagination: { page, limit, total: totalCount },
      });
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
          account: true,
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
          include: {
            account: true,
          },
        });

        if (!deposit) {
          throw Object.assign(new Error('Deposit not found'), {
            status: 404,
          });
        }

        if (deposit.status !== 'pending') {
          throw Object.assign(
            new Error('Only pending deposits can be approved'),
            { status: 400 },
          );
        }

        await prisma.account.update({
          where: { id: deposit.account.id },
          data: {
            availableBalance: {
              increment: deposit.amount.mul(deposit.perUsdRate),
            },
          },
        });

        await prisma.deposit.update({
          where: { id: depositId },
          data: { status: 'approved' },
        });

        await prisma.transaction.create({
          data: {
            accountId: deposit.account.id,
            type: 'deposit',
            amount: deposit.amount.mul(deposit.perUsdRate),
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
            status: 404,
          });
        }

        if (deposit.status !== 'pending') {
          throw Object.assign(
            new Error('Only pending deposits can be rejected'),
            { status: 400 },
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
