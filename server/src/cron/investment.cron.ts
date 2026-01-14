import investmentController from '@/controllers/investmentController';
import cron from 'node-cron';

export const startInvestmentCron = () => {
  // Schedule the cron job to run every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('Running investment expiration cron job...');
    await investmentController.expireInvestmentsCron();
  });
};