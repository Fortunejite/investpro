import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import z from 'zod';
import { getCoinById } from '@/services/coinlore';

const swapSchema = z.object({
  fromAssetCoinId: z.string(),
  toAssetCoinId: z.string(),
  amount: z.number().positive(),
});

const isAccountAsset = (coinId: string) => coinId === 'account';

const getAssetById = async (prisma: any, userId: number, coinId: string) => {
  if (isAccountAsset(coinId)) {
    return await prisma.account.findUnique({ where: { id: userId } });
  } else {
    let asset = await prisma.asset.findUnique({ where: { userId_coinId: { userId, coinId } } });
    if (!asset) {
      // Create asset if it doesn't exist
      asset = await prisma.asset.create({
        data: {
          userId,
          coinId,
        },
      });
    }
    return asset;
  }
};

const getExchangeRate = async (fromCoinId: string, toCoinId: string): Promise<number> => {
  const fromCoinPrice = isAccountAsset(fromCoinId) ? 1 : parseFloat((await getCoinById(fromCoinId)).price_usd);
  const toCoinPrice = isAccountAsset(toCoinId) ? 1 : parseFloat((await getCoinById(toCoinId)).price_usd);
  if (toCoinPrice === 0) throw Object.assign(new Error('Invalid toCoin price'), { status: 400 });
  return fromCoinPrice / toCoinPrice;
};

class SwapController {
  getSwaps = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      // pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const swaps = await prisma.swap.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
      res.status(200).json({ data: swaps });
    } catch (error) {
      next(error);
    }
  };

  swapAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const { fromAssetCoinId, toAssetCoinId, amount } = swapSchema.parse(req.body);

      if (fromAssetCoinId === toAssetCoinId) {
        return res.status(400).json({ message: 'From and to assets must be different' });
      }

      await prisma.$transaction(
        async (prisma) => {
          // Fetch assets
          const fromAsset = await getAssetById(prisma, userId, fromAssetCoinId);
          const toAsset = await getAssetById(prisma, userId, toAssetCoinId);
    
          if (!fromAsset || !toAsset) {
            return res.status(404).json({ message: 'One or both assets not found' });
          }
    
          if (fromAsset.availableBalance.lt(amount)) {
            return res.status(400).json({ message: 'Insufficient funds in from asset' });
          }
    
          // Calculate exchange rate
          const exchangeRate = await getExchangeRate(fromAssetCoinId, toAssetCoinId);
          const adjustedAmount = amount * exchangeRate;

          // Update balances
          if (isAccountAsset(fromAssetCoinId)) {
            await prisma.account.update({
              where: { id: userId },
              data: {
                availableBalance: {
                  decrement: amount,
                },
              },
            });
          } else {
            await prisma.asset.update({
              where: { id: fromAsset.id },
              data: {
                availableBalance: {
                  decrement: amount,
                },
              },
            });
          }

          if (isAccountAsset(toAssetCoinId)) {
            await prisma.account.update({
              where: { id: userId },
              data: {
                availableBalance: {
                  increment: adjustedAmount,
                },
              },
            });
          } else {
            await prisma.asset.update({
              where: { id: toAsset.id },
              data: {
                availableBalance: {
                  increment: adjustedAmount,
                },
              },
            });
          }

          // Record the swap
          await prisma.swap.create({
            data: {
              userId,
              fromAssetId: fromAsset.id,
              toAssetId: toAsset.id,
              amount: amount,
              exchangeRate: exchangeRate,
            },
          });
        }
      );

      res.status(200).json({ message: 'Assets swapped successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export default new SwapController();
