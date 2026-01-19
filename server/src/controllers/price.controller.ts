import config from '@/config';
import { getPriceInUsd } from '@/services/price';
import { Request, Response, NextFunction } from 'express';
import z from 'zod';

const bodySchema = z.object({
  coin: z.enum(config.chains, 'Invalid coin parameter'),
});

class PriceController {
  getCurrentPrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { coin } = bodySchema.parse({ coin: req.params.coin });
      const currentPrice = await getPriceInUsd(coin);

      res.status(200).json({ usd: currentPrice });
    } catch (error) {
      next(error);
    }
  };
}

export default new PriceController();