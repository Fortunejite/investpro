import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/client';
import { getCoinById } from './coinlore';
import { Positions } from '@prisma/client';
import queuePositionForCopy from '@/queues/position.queue';

interface OpenPositionParams {
  userId: number;
  coinId: string;
  side: 'buy' | 'sell';
  margin: number;
  leverage: number;
  durationMinutes: number;
  originalPositionId?: string; // for copying positions
}

class PositionService {
  computePositionFromEntryPrice = (
    leverage: number,
    entryPrice: number,
    margin: number,
  ) => {
    const marginDecimal = new Decimal(margin);
    const notional = marginDecimal.mul(leverage);
    const size = notional.div(entryPrice);
    return { notional, size };
  };

  computePnl = (
    side: 'long' | 'short',
    entryPrice: Decimal,
    exitPrice: Decimal,
    size: Decimal,
  ) => {
    if (side === 'long') {
      return exitPrice.minus(entryPrice).mul(size);
    } else {
      return entryPrice.minus(exitPrice).mul(size);
    }
  };

  closePosition = async (position: Positions) => {
    const exitPrice = parseFloat(
      (await getCoinById(position.coinId)).price_usd,
    );

    const pnl = this.computePnl(
      position.side,
      position.entryPrice,
      new Decimal(exitPrice),
      position.size,
    );

    const status = pnl.lessThanOrEqualTo(-position.margin)
      ? 'liquidated'
      : 'closed';

    await prisma.$transaction(async (prisma) => {
      await prisma.positions.update({
        where: { id: position.id },
        data: {
          closePrice: new Decimal(exitPrice),
          status,
          pnl,
          closedAt: new Date(),
        },
      });

      await prisma.account.update({
        where: { id: position.userId },
        data: {
          availableBalance:
            status === 'liquidated'
              ? { increment: 0 }
              : { increment: position.margin.add(pnl) },
          lockedBalance: { decrement: position.margin },
        },
      });

      if (status === 'closed') {
        await prisma.transaction.create({
          data: {
            accountId: position.userId,
            type: 'close_position',
            amount: position.margin.add(pnl),
            actionId: position.id,
          },
        });
      }
    });
  };

  openPosition = async ({
    userId,
    coinId,
    side,
    margin,
    leverage,
    durationMinutes,
    originalPositionId
  }: OpenPositionParams) => {
    const account = await prisma.account.findUnique({
      where: { id: userId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!account) {
      throw Object({ message: 'Account not found', status: 404 });
    }

    if (account.availableBalance.lessThan(margin)) {
      throw Object({ message: 'Insufficient funds', status: 400 });
    }

    const entryPrice = parseFloat((await getCoinById(coinId)).price_usd);

    const { notional, size } = this.computePositionFromEntryPrice(
      leverage,
      entryPrice,
      margin,
    );

    const newTrade = {
      userId,
      coinId,
      side: side === 'buy' ? 'long' : ('short' as 'long' | 'short'),
      margin,
      leverage,
      notional,
      entryPrice,
      size,
      expiryAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      originalPositionId,
    };

    await prisma.$transaction(async (prisma) => {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          availableBalance: { decrement: margin },
          lockedBalance: { increment: margin },
        },
      });

      const position = await prisma.positions.create({
        data: newTrade,
      });

      if (!originalPositionId && account.user.role === 'trader') {
        await queuePositionForCopy(position);
      }

      await prisma.transaction.create({
        data: {
          accountId: userId,
          type: 'open_position',
          amount: margin,
          actionId: position.id,
        },
      });
    });


    return newTrade;
  };

  copyPosition = async (position: Positions, page = 1) => {
    const { coinId, side, margin, leverage, expiryAt } = position;
    const limit = 100;
    const skip = (page - 1) * limit;

    const followers = await prisma.traderFollower.findMany({
      where: { traderId: position.userId },
      skip,
      take: limit,
    });

    for (const follower of followers) {
      await this.openPosition({
        userId: follower.userId,
        coinId,
        side: side === 'long' ? 'buy' : 'sell',
        margin: margin as unknown as number,
        leverage,
        durationMinutes: Math.ceil((new Date(expiryAt).getTime() - Date.now()) / (60 * 1000)),
        originalPositionId: position.id,
      });
    }

    if (followers.length === limit) {
      await this.copyPosition(position, page + 1);
    }
  };
}

export default new PositionService();
