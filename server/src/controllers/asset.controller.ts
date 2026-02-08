import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

class AssetController {
  getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const assets = await prisma.asset.findMany({
        where: { userId, availableBalance: { gt: new Prisma.Decimal(0) } },
        include: { coin: true },
      });
      res.status(200).json({ data: assets });
    } catch (error) {
      next(error);
    }
  };

  getAssetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const coinId = req.params.id as string;
      const asset = await prisma.asset.findUnique({
        where: { userId_coinId: { userId, coinId } },
        include: { coin: true },
      });
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      res.status(200).json(asset);
    } catch (error) {
      next(error);
    }
  };
}

export default new AssetController();
