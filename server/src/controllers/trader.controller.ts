import { Request, Response, NextFunction } from 'express';
import z from 'zod';
import { prisma } from '@/lib/prisma';

const createTraderProfileSchema = z.object({
  userId: z.number(),
  bio: z.string().max(255).optional(),
  profitSharePercent: z.number().min(0).max(100),
  totalProfit: z.number().min(0),
  winRate: z.number().min(0).max(100),
  totalTrades: z.number().min(0),
  successfulTrades: z.number().min(0),
  minCapital: z.number().min(0),
});

const editTraderProfileSchema = createTraderProfileSchema.partial().omit({ userId: true });

class TraderController {
  getAllTraders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search as string;
      
      const where = search ? {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' as const } } },
          { bio: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {};

      const traders = await prisma.tradingProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { totalProfit: 'desc' },
      });
      
      res.json(traders);
    } catch (error) {
      next(error);
    }
  };

  createTraderProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {userId, ...parsedData} = createTraderProfileSchema.parse(req.body);

      const existingProfile = await prisma.tradingProfile.findUnique({
        where: { id: userId },
      });

      if (existingProfile) {
        return res.status(400).json({ message: 'Trader profile already exists' });
      }

      const newProfile = await prisma.tradingProfile.create({
        data: {
          id: userId,
          ...parsedData,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { role: 'trader' },
      });

      res.status(201).json(newProfile);
    } catch (error) {
      next(error);
    }
  };

  editTraderProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUserId = req.user.id;
      const userId = parseInt(req.params.id as string);
      const parsedData = editTraderProfileSchema.parse(req.body);

      if (authUserId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const updatedProfile = await prisma.tradingProfile.update({
        where: { id: userId },
        data: {
          ...parsedData,
        },
      });

      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  };

  deleteTraderProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUserId = req.user.id;
      const userId = parseInt(req.params.id as string);

      if (authUserId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await Promise.all([
        prisma.tradingProfile.delete({
          where: { id: userId },
        }),
        prisma.traderFollower.deleteMany({
          where: { traderId: userId },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { role: 'user' },
        }),
      ]);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  copyTrader = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const traderId = parseInt(req.params.id as string);
      const userId = req.user.id;

      const traderProfile = await prisma.tradingProfile.findUnique({
        where: { id: traderId },
      });

      if (!traderProfile) {
        return res.status(404).json({ message: 'Trader profile not found' });
      }

      await prisma.traderFollower.create({
        data: {
          userId: userId,
          traderId: traderId,
        },
      });

      res.json({ message: `User ${userId} is now copying trader ${traderId}` });
    } catch (error) {
      next(error);
    }
  };

  unCopyTrader = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const traderId = parseInt(req.params.id as string);
      const userId = req.user.id;

      const followRecord = await prisma.traderFollower.findUnique({
        where: {
          traderId_userId: {
            userId: userId,
            traderId: traderId,
          },
        },
      });

      if (!followRecord) {
        return res.status(404).json({ message: 'Follow record not found' });
      }

      await prisma.traderFollower.delete({
        where: {
          traderId_userId: {
            userId: userId,
            traderId: traderId,
          },
        },
      });

      res.json({ message: `User ${userId} has stopped copying trader ${traderId}` });
    } catch (error) {
      next(error);
    }
  };

  getCopiedTraders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      
      const copiedTraders = await prisma.traderFollower.findMany({
        where: { userId },
        include: {
          trader: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(copiedTraders);
    } catch (err) {
      next(err);
    }
  };
};

export default new TraderController();