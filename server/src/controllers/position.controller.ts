import { Request, Response, NextFunction } from 'express';
import z from 'zod';
import { prisma } from '@/lib/prisma';
import PositionService from '@/services/position.service';

const createTradeSchema = z.object({
  coinId: z.string(),
  side: z.enum(['buy', 'sell']),
  margin: z.number().min(10),
  leverage: z.number().min(1).max(100),
  durationMinutes: z
    .number()
    .min(1)
    .max(7 * 24 * 60), // 1 minute to 7 days
});

class PositionController {
  openPosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { coinId, side, margin, leverage, durationMinutes } =
        createTradeSchema.parse(req.body);

      const newPosition = await PositionService.openPosition({
        userId,
        coinId,
        side,
        margin,
        leverage,
        durationMinutes,
      });
      
      res.json(newPosition);
    } catch (error) {
      next(error);
    }
  };

  getPositions = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const queryParams = req.query;

    try {
      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      //filter
      const side = queryParams.side as string;
      if (side && !['BUY', 'SELL'].includes(side)) {
        res.status(400).json({ message: 'Invalid side params' });
      }

      const where = {
        userId,
      } as any;
      if (side) where.side = side;

      const [positions, total] = await Promise.all([
        prisma.positions.findMany({
          where,
          skip,
          take: limit,
        }),
        prisma.positions.count({ where }),
      ]);

      res.json({ positions, pagination: { total, page, limit } });
    } catch (error) {
      next(error);
    }
  };

  getPositionById = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;

    try {
      const position = await prisma.positions.findUnique({
        where: { id },
      });

      if (!position) {
        return res.status(404).json({ message: 'Position not found' });
      }

      res.json(position);
    } catch (error) {
      next(error);
    }
  };

  closePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tradeId = req.params.id as string;

      const position = await prisma.positions.findUnique({ where: { id: tradeId } });
      if (!position || position.userId !== req.user.id) {
        throw new Error('Position not found');
      } else if (position.status !== 'open') {
        throw new Error('Position already closed');
      }
      await PositionService.closePosition(position);
      res.json({ message: 'Position closed successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export default new PositionController();
