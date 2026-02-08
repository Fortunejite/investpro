import { prisma } from '@/lib/prisma';
import { getLatestPrice } from '@/services/binance';
import { Decimal } from '@prisma/client/runtime/client';
import { Request, Response, NextFunction } from 'express';
import z from 'zod';

const createTradeSchema = z.object({
  asset: z.string(),
  side: z.enum(['BUY', 'SELL']),
  collateralUsd: z.number().min(10),
  leverage: z.number().min(1).max(100),
  durationSeconds: z
    .number()
    .min(60)
    .max(7 * 24 * 3600), // 1 minute to 7 days
});

class TradesController {
  createTrade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { asset, side, collateralUsd, leverage, durationSeconds } =
        createTradeSchema.parse(req.body);

      const tick = getLatestPrice(asset);
      if (!tick) {
        return res.status(400).json({ error: 'No price feed' });
      }

      const entryPrice = new Decimal(tick.price);
      const collateral = new Decimal(collateralUsd);

      const notional = collateral.mul(leverage);
      const qty = notional.div(entryPrice);

      const position = await prisma.positions.create({
        data: {
          userId,
          asset,
          side,
          leverage,
          collateral,
          notional,
          entryPrice,
          qty,
          expiryAt: new Date(Date.now() + durationSeconds * 1000),
        },
      });

      res.json(position);
    } catch (error) {
      next(error);
    }
  };

  getTrades = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const queryParams = req.query;

    // pagination
    const page = parseInt(queryParams.page as string) || 1;
    const limit = parseInt(queryParams.limit as string) || 10;
    const skip = (page - 1) * limit;

    //filter
    const side = queryParams.side as string;
    if (!side || !['BUY', 'SELL'].includes(side)) {
      res.status(400).json({ message: 'Invalid side params' });
    }

    const where = {
      userId,
    } as any;
    if (side) where.side = side;

    const [trades, total] = await Promise.all([
      prisma.positions.findMany({
        where,
        skip,
        take: limit,
      }),
      prisma.positions.count({ where }),
    ]);

    res.json({ trades, pagination: { total, page, limit } });
  };
}

export default new TradesController();
