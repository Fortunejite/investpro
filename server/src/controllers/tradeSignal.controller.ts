import { Request, Response, NextFunction } from 'express';
import z from 'zod';
import { prisma } from '@/lib/prisma';
import { TradeSignal, TradeSignalSubscription } from '@prisma/client';
import queueSignalForDelivery from '@/queues/signalDelivery';
import config from '@/config';

const signalSchema = z.object({
  action: z.enum(['Buy', 'Sell']),
  currency: z.string(),
  entryPrice: z.number().min(0),
  tp1: z.number().min(0),
  tp2: z.number().min(0).optional(),
  sl: z.number().min(0),
  scheduledAt: z.string().optional(),
});

const subscribeSchema = z.object({
  plan: z.enum(
    Object.keys(config.signals) as Array<keyof typeof config.signals>,
  ),
});

const deliverSignal = async (signal: TradeSignal) => {
  if (!signal.scheduledAt) {
    await queueSignalForDelivery(signal.id);
  } else {
    await queueSignalForDelivery(signal.id, { runAt: signal.scheduledAt });
  }
};

class TradeSignalController {
  async createTradeSignal(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = signalSchema.parse(req.body);
      if (validatedData.scheduledAt && new Date(validatedData.scheduledAt) < new Date()) {
        return res
          .status(400)
          .json({ message: 'scheduledAt must be a future date' });
      }

      const tradeSignal = await prisma.tradeSignal.create({
        data: {
          ...validatedData,
        },
      });
      await deliverSignal(tradeSignal);

      res.status(201).json(tradeSignal);
    } catch (error) {
      next(error);
    }
  }

  async getTradeSignals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // filter
      const actionFilter = queryParams.action as 'Buy' | 'Sell' | undefined;
      if (actionFilter && !['Buy', 'Sell'].includes(actionFilter)) {
        return res.status(400).json({ message: 'Invalid action filter' });
      }
      const currency = queryParams.currency as string | undefined;

      const subscriber = await prisma.tradeSignalSubscription.findUnique({
        where: { userId },
      });

      if (
        !req.user.role.includes('admin') &&
        (!subscriber || !subscriber.isActive)
      ) {
        return res
          .status(403)
          .json({ message: 'You are not subscribed to trade signals' });
      }

      const [tradeSignals, totalCount] = await Promise.all([
        await prisma.tradeSignal.findMany({
          where: {
            ...(actionFilter ? { action: actionFilter } : {}),
            ...(currency
              ? { currency: { contains: currency, mode: 'insensitive' } }
              : {}),
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        await prisma.tradeSignal.count(),
      ]);

      res
        .status(200)
        .json({
          data: tradeSignals,
          pagination: { page, limit, total: totalCount },
        });
    } catch (error) {
      next(error);
    }
  }

  async getTradeSignalById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const tradeSignalId = parseInt(req.params.id as string);

      const subscriber = await prisma.tradeSignalSubscription.findUnique({
        where: { userId },
      });

      if (
        !req.user.role.includes('admin') &&
        (!subscriber || !subscriber.isActive)
      ) {
        return res
          .status(403)
          .json({ message: 'You are not subscribed to trade signals' });
      }

      const tradeSignal = await prisma.tradeSignal.findUnique({
        where: { id: tradeSignalId },
      });

      if (!tradeSignal) {
        return res.status(404).json({ message: 'Trade signal not found' });
      }

      res.status(200).json(tradeSignal);
    } catch (error) {
      next(error);
    }
  }

  async getTradeSignalDeliveries(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const tradeSignalId = parseInt(req.params.id as string);
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [deliveries, totalCount] = await Promise.all([
        await prisma.tradeSignalDeliveries.findMany({
          where: { signalId: tradeSignalId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        }),
        await prisma.tradeSignalDeliveries.count({
          where: { signalId: tradeSignalId },
        }),
      ]);
      res.status(200).json({ data: deliveries, pagination: { page, limit, total: totalCount } });
    } catch (error) {
      next(error);
    }
  }

  async updateTradeSignal(req: Request, res: Response, next: NextFunction) {
    try {
      const tradeSignalId = parseInt(req.params.id as string);

      const validatedData = signalSchema.parse(req.body);

      const existingSignal = await prisma.tradeSignal.findUnique({
        where: { id: tradeSignalId },
      });

      if (!existingSignal) {
        return res.status(404).json({ message: 'Trade signal not found' });
      }

      if (existingSignal.publishedAt) {
        return res
          .status(400)
          .json({ message: 'Cannot update a published trade signal' });
      }

      const tradeSignal = await prisma.tradeSignal.update({
        where: { id: tradeSignalId },
        data: validatedData,
      });

      res.status(200).json(tradeSignal);
    } catch (error) {
      next(error);
    }
  }

  async deleteTradeSignal(req: Request, res: Response, next: NextFunction) {
    try {
      const tradeSignalId = parseInt(req.params.id as string);

      await prisma.tradeSignal.delete({
        where: { id: tradeSignalId },
      });

      res.status(204).json({ message: 'Trade signal deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async subscribeToSignals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const validatedData = subscribeSchema.parse(req.body);
      const account = await prisma.account.findUnique({
        where: { id: userId },
        select: { id: true, availableBalance: true },
      });

      if (!account) {
        return res.status(404).json({ message: 'Wallet not Found' });
      }

      if (
        account.availableBalance.lessThan(config.signals[validatedData.plan])
      ) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }

      let subscription: TradeSignalSubscription | null = null;
      const endedAt = new Date();
      endedAt.setMonth(endedAt.getMonth() + 1); // 1 month subscription

      await prisma.$transaction(async (prisma) => {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            availableBalance: { decrement: config.signals[validatedData.plan] },
          },
        });
        await prisma.transaction.create({
          data: {
            accountId: userId,
            type: 'signal_subscription',
            amount: config.signals[validatedData.plan],
          },
        });
        subscription = await prisma.tradeSignalSubscription.upsert({
          where: { userId },
          update: { isActive: true, endedAt },
          create: {
            userId,
            plan: validatedData.plan as keyof typeof config.signals,
            endedAt,
          },
        });
      });

      res.status(200).json(subscription);
    } catch (error) {
      next(error);
    }
  }

  async getAllSubscribers(req: Request, res: Response, next: NextFunction) {
    try {
      // Pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // filter
      const search = req.query.search as string | undefined;

      const [subscribers, totalCount] = await Promise.all([
        prisma.tradeSignalSubscription.findMany({
          where: {
            ...(search
              ? { user: { name: { contains: search, mode: 'insensitive' } } }
              : {}),
          },
          skip,
          take: limit,
          include: { user: true },
          orderBy: { startedAt: 'desc' },
        }),
        prisma.tradeSignalSubscription.count({
          where: {
            ...(search
              ? { user: { name: { contains: search, mode: 'insensitive' } } }
              : {}),
          },
        }),
      ]);

      res.status(200).json({ data: subscribers, pagination: { page, limit, total: totalCount } });
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;

      const subscription = await prisma.tradeSignalSubscription.findUnique({
        where: { userId },
      });

      if (subscription?.endedAt && subscription.endedAt < new Date()) {
        await prisma.tradeSignalSubscription.update({
          where: { userId },
          data: { isActive: false },
        });
        subscription.isActive = false;
      }

      res.status(200).json(subscription);
    } catch (error) {
      next(error);
    }
  }
}

export default new TradeSignalController();
