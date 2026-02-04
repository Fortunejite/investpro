import cron from 'node-cron';
import { prisma } from "@/lib/prisma";
import { getLatestPrice } from "@/services/binance";
import { Decimal } from "@prisma/client/runtime/client";


async function closeExpiredPositions() {
  const now = new Date();

  const positions = await prisma.positions.findMany({
    where: {
      status: 'open',
      expiryAt: { lte: now }
    }
  });

  for (const pos of positions) {
    const tick = getLatestPrice(pos.asset);
    if (!tick) continue;

    const close = new Decimal(tick.price);

    const { entryPrice: entry, qty } = pos;

    let pnl;
    if (pos.side === 'BUY') {
      pnl = qty.mul(close.sub(entry));
    } else {
      pnl = qty.mul(entry.sub(close));
    }

    await prisma.positions.update({
      where: { id: pos.id },
      data: {
        status: 'closed',
        closePrice: close,
        pnl
      }
    });
  }
}

export const startTradesCron = () => {
  // Schedule the cron job to run every minutes
  cron.schedule('* * * * *', async () => {
    console.log('Running trades expiration cron job...');
    await closeExpiredPositions();
  });
};