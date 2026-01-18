import { Request, Response, NextFunction } from 'express';

class PriceController {
  getCurrentPrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Placeholder logic for fetching current price
      const currentPrice = 100.0; // This would be replaced with real data fetching logic

      res.status(200).json({ usd: currentPrice });
    } catch (error) {
      next(error);
    }
  };
}

export default new PriceController();