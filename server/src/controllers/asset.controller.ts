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
}

export default new AssetController();
