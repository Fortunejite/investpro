import Bull from 'bull';
import Bottleneck from 'bottleneck';
import emailService from '@/services/email';

const limiter = new Bottleneck({
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 1000,
});

const deliverEmail = async (job: Bull.Job) => {
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

export default deliverEmail;
