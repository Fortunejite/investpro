import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import z from 'zod';
import config from '@/config';
import { Investment } from '@/generated/prisma/client';

const createInvestmentSchema = z.object({
  planId: z.number(),
  amount: z.number().positive(),
});

class InvestmentController {
  getUserInvestments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Filters
      const status =
        queryParams.status as
          | (typeof config.investmentStatuses)[number]
          | undefined;
      if (status && !config.investmentStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status parameter' });
      }
      const investments = await prisma.investment.findMany({
        where: {
          accountId: userId,
          ...(status ? { status } : {}),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ data: investments, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };

  getUserInvestmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const investmentId = req.params.id as string;

      const investment = await prisma.investment.findUnique({
        where: { id: investmentId },
        include: {
          account: true,
          plan: true,
        },
      });

      if (!investment || investment.account.id !== userId) {
        return res.status(404).json({ message: 'Investment not found' });
      }

      res.status(200).json(investment);
    } catch (err) {
      next(err);
    }
  };

  createInvestment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createInvestmentSchema.parse(req.body);

      let newInvestment: Investment | null = null;
      await prisma.$transaction(async (prisma) => {
        const plan = await prisma.investmentPlan.findUnique({
          where: { id: validatedData.planId },
        });

        if (!plan || !plan.isActive) {
          throw Object.assign(new Error('Invalid or inactive investment plan'), {
            status: 400,
          });
        }

        const userWallet = await prisma.account.findUnique({
          where: { id: req.user.id },
        });

        if (!userWallet || userWallet.availableBalance.lessThan(validatedData.amount)) {
          throw Object.assign(new Error('Insufficient funds in wallet'), {
            status: 400,
          });
        }

        if (validatedData.amount < plan.minAmount) {
          throw Object.assign(new Error(`Investment amount is below the minimum of ${plan.minAmount}`), {
            status: 400,
          });
        }

        await prisma.account.update({
          where: { id: userWallet.id },
          data: {
            availableBalance: { decrement: validatedData.amount },
            lockedBalance: { increment: validatedData.amount },
          },
        });

        newInvestment = await prisma.investment.create({
          data: {
            accountId: userWallet.id,
            planId: validatedData.planId,
            amount: validatedData.amount,
            profit: (validatedData.amount * plan.roiPercent) / 100,
            startDate: new Date(),
            endDate: new Date(Date.now() + plan.durationInDays * 24 * 60 * 60 * 1000),
          },
        });

        await prisma.transaction.create({
          data: {
            accountId: userWallet.id,
            type: 'investment',
            amount: validatedData.amount,
            actionId: newInvestment.id,
          },
        });

      });


      res.status(201).json(newInvestment);
    } catch (err) {
      next(err);
    }
  };

  endInvestment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const investmentId = req.params.id as string;

      const investment = await prisma.investment.findUnique({
        where: { id: investmentId },
        include: { account: true },
      });

      if (!investment) {
        return res.status(404).json({ message: 'Investment not found' });
      }

      if (investment.status !== 'active') {
        return res.status(400).json({ message: 'Only active investments can be ended' });
      }

      await prisma.$transaction(async (prisma) => {
        await prisma.account.update({
          where: { id: investment.accountId },
          data: {
            availableBalance: {
              increment: investment.amount.plus(investment.profit),
            },
            lockedBalance: {
              decrement: investment.amount,
            },
          },
        });

        await prisma.investment.update({
          where: { id: investmentId },
          data: { status: 'inactive' },
        });

        await prisma.transaction.create({
          data: {
            accountId: investment.accountId,
            type: 'profit_payout',
            amount: investment.profit.plus(investment.amount),
            actionId: investment.id,
          },
        });
      });

      res.status(200).json({ message: 'Investment ended successfully' });
    } catch (err) {
      next(err);
    }
  };

  expireInvestmentsCron = async () => {
    try {
      const maturedInvestments = await prisma.investment.findMany({
        where: {
          status: 'active',
          endDate: { lte: new Date() },
        },
      });

      for (const investment of maturedInvestments) {
        await prisma.$transaction(async (prisma) => {
          await prisma.account.update({
            where: { id: investment.accountId },
            data: {
              availableBalance: {
                increment: investment.amount.plus(investment.profit),
              },
              lockedBalance: {
                decrement: investment.amount,
              },
            },
          });

          await prisma.investment.update({
            where: { id: investment.id },
            data: { status: 'expired' },
          });

          await prisma.transaction.create({
            data: {
              accountId: investment.accountId,
              type: 'profit_payout',
              amount: investment.profit.plus(investment.amount),
              actionId: investment.id,
            },
          });
        });
      }
      console.log(`Expired ${maturedInvestments.length} investments.`);
      return;
    } catch (err) {
      console.error('Error expiring investments:', err);
    }
  };

  getAllInvestments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Filters
      const status =
        queryParams.status as
          | (typeof config.investmentStatuses)[number]
          | undefined;
      const userId = parseInt(queryParams.userId as string) || undefined;
      if (status && !config.investmentStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status parameter' });
      }

      const investments = await prisma.investment.findMany({
        where: {
          ...(status ? { status } : {}),
          accountId: userId,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          account: true,
          plan: true,
        },
      });
      res.status(200).json({ data: investments, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };
}

export default new InvestmentController();