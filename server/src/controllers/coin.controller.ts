import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { getAllCoins } from '@/services/coinlore';

class CoinController {
  getCoins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;

      // filters
      const query = req.query;
      const search = query.search as string | undefined;

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { symbol: { contains: search, mode: 'insensitive' } },
          ],
        }),
      } as any;

      const [coins, total] = await Promise.all([
        prisma.coin.findMany({
          orderBy: { rank: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          where,
        }),
        prisma.coin.count({ where }),
      ]);
      res.status(200).json({ data: coins, pagination: { page, limit, total } });
    } catch (error) {
      next(error);
    }
  };

  getCoinById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params;
      const id = params.id as string;
      const coin = await prisma.coin.findUnique({
        where: { id },
      });
      if (!coin) {
        return res.status(404).json({ message: 'Coin not found' });
      }
      res.status(200).json(coin);
    } catch (error) {
      next(error);
    }
  };

  syncCoins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let start = 0;
      const limit = 100;

      while (true) {
        const coins = await getAllCoins(start, limit);
        await Promise.all(
          coins.data.map(async (coin) => {
            await prisma.coin.upsert({
              where: { id: coin.id },
              update: {
                symbol: coin.symbol,
                name: coin.name,
                nameId: coin.nameid,
                rank: coin.rank,
                img: coin.img,
              },
              create: {
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                nameId: coin.nameid,
                rank: coin.rank,
                img: coin.img,
              },
            });
          })
        );

        if (coins.data.length < limit) {
          break;
        }
        start += limit;
      }

      res.status(200).json({ message: 'Coins synchronized successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export default new CoinController();
