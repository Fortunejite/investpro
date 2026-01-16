import { Request, Response, NextFunction } from 'express';
import z from 'zod';
import { prisma } from '@/lib/prisma';
import { TradeSignal } from '@prisma/client';
import queueSignalForDelivery from '@/queues/signalDelivery';
import config from '@/config';

const signalSchema = z.object({
  action: z.enum(['Buy', 'Sell']),
  currency: z.string(),
  entryPrice: z.number().min(0),
  tp1: z.number().min(0),
  tp2: z.number().min(0).optional(),
  sl: z.number().min(0),
  scheduledAt: z.date().optional(),
});

const subscribeSchema = z.object({
  plan: z.enum(Object.keys(config.signals)),
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
      if (validatedData.scheduledAt && validatedData.scheduledAt < new Date()) {
        return res.status(400).json({ message: 'scheduledAt must be a future date' });
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
  };

  async getTradeSignals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      const subscriber = await prisma.tradeSignalSubscription.findUnique({
        where: { userId },
      });

      if (!req.user.role.includes('admin') && (!subscriber || !subscriber.isActive)) {
        return res.status(403).json({ message: 'You are not subscribed to trade signals' });
      }

      const tradeSignals = await prisma.tradeSignal.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ data: tradeSignals, pagination: { page, limit } });
    } catch (error) {
      next(error);
    }
  };

  async getTradeSignalById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const tradeSignalId = parseInt(req.params.id as string);

      const subscriber = await prisma.tradeSignalSubscription.findUnique({
        where: { userId },
      });

      if (!req.user.role.includes('admin') && (!subscriber || !subscriber.isActive)) {
        return res.status(403).json({ message: 'You are not subscribed to trade signals' });
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
  };

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
        return res.status(400).json({ message: 'Cannot update a published trade signal' });
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

      const subscription = await prisma.tradeSignalSubscription.upsert({
        where: { userId },
        update: { isActive: true },
        create: { userId, plan: validatedData.plan as keyof typeof config.signals },
      });

      res.status(200).json(subscription);
    } catch (error) {
      next(error);
    }
  };

  async getAllSubscribers(req: Request, res: Response, next: NextFunction) {
    try {
      // Pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const subscribers = await prisma.tradeSignalSubscription.findMany({
        skip,
        take: limit,
        include: { user: true },
        orderBy: { startedAt: 'desc' },
      });

      res.status(200).json({ data: subscribers, pagination: { page, limit } });
    } catch (error) {
      next(error);
    }
  };

  async getSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;

      const subscription = await prisma.tradeSignalSubscription.findUnique({
        where: { userId },
      });

      res.status(200).json(subscription);
    } catch (error) {
      next(error);
    }
  }
}

export default new TradeSignalController();