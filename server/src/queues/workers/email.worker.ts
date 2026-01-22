import { Job, Worker } from 'bullmq';
import Bottleneck from 'bottleneck';
import emailService from '@/services/email';
import { queueConfig } from '..';

const limiter = new Bottleneck({
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 1000,
});

const deliverEmail = async (job: Job) => {
  const { email, resetToken, emailType } = job.data;

  await limiter.schedule(async () => {
    try {
      if (emailType === 'passwordReset') {
        await emailService.sendPasswordResetEmail(email, resetToken);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  });
};

const emailWorker = new Worker("email-delivery-queue", async (job) => {
  await deliverEmail(job);
}, queueConfig);

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});
