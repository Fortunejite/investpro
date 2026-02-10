import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import PositionService from '@/services/position.service';

async function closeExpiredPositions() {
  const now = new Date();

  const positions = await prisma.positions.findMany({
    where: {
      status: 'open',
      expiryAt: { lte: now },
    },
  });

  for (const pos of positions) {
    await PositionService.closePosition(pos);
  }
}

export const startPositionsCron = () => {
  // Schedule the cron job to run every minutes
  cron.schedule('* * * * *', async () => {
    console.log('Running positions expiration cron job...');
    await closeExpiredPositions();
  });
};
