import { prisma } from "@/lib/prisma";
import Bull from "bull";
import Bottleneck from "bottleneck";
import { sendSignalMessage } from "@/services/telegram";
import { AxiosError } from "axios";

const limiter = new Bottleneck({ reservoir: 20, reservoirRefreshAmount: 20, reservoirRefreshInterval: 1000 });

const deliverSignal = async (job: Bull.Job) => {
  const { signalId } = job.data;

  const signal = await prisma.tradeSignal.findUnique({
    where: { id: signalId },
    include: {
      deliveries: true,
    },
  });

  if (!signal) {
    throw new Error('signal not found')
  }

  await prisma.tradeSignal.update({
    where: { id: signal.id },
    data: { publishedAt: new Date() },
  });

  const subscribers = await prisma.tradeSignalSubscription.findMany({
    where: {},
    include: { user: true }
  });

  for (const subscriber of subscribers) {
    if (!subscriber.isActive) continue;
    const delivery = await prisma.tradeSignalDeliveries.create({
      data: {
        signalId: signal.id,
        userId: subscriber.userId,
        telegramUserId: subscriber.user.telegramUserId!,
      },
      include: { signal: true }
    });

    await limiter.schedule(async () => {
      try {
        await sendSignalMessage(delivery);
        await prisma.tradeSignalDeliveries.update({
          where: { id: delivery.id },
          data: {
            status: 'sent',
            lastAttempt: new Date(),
            attempts: { increment: 1 },
          },
        });
      } catch (error) {
        console.error('Error sending signal message:', error);
        await prisma.tradeSignalDeliveries.update({
          where: { id: delivery.id },
          data: {
            status: 'failed',
            lastAttempt: new Date(),
            attempts: { increment: 1 },
            error: (error as AxiosError).response?.data || (error as Error).message,
          },
        });
      }
    });
  }
}

export default deliverSignal;