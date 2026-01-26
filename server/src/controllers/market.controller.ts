import config from '@/config';
import { getAllCoins, getCoinById, getPriceInUsd } from '@/services/coinlore';
import { Request, Response, NextFunction } from 'express';
import z from 'zod';

const bodySchema = z.object({
  coin: z.enum(config.chains, 'Invalid coin parameter'),
});

class MarketController {
  getCurrentPrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { coin } = bodySchema.parse({ coin: req.params.coin });
      const currentPrice = await getPriceInUsd(coin);

      res.status(200).json({ usd: currentPrice });
    } catch (error) {
      next(error);
    }
  };

  getCoinsData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;

      const coins = await getAllCoins((page - 1) * limit, limit);
      res.status(200).json(coins);
    } catch (error) {
      next(error);
    }
  };

  getCoinById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const coin = await getCoinById(id as string);
      res.status(200).json(coin);
    } catch (error) {
      next(error);
    }
  };
}

export default new MarketController();