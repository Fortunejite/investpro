import nodemailer from 'nodemailer';
import config from '@/config';
import { forgotPasswordEmail } from './forgotPassword';

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  const mailOptions = {
    from: config.email.auth.user,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

class EmailService {
  sendPasswordResetEmail = async (to: string, token: string) => {
    const data = forgotPasswordEmail(token, to);
    await sendEmail(to, data.subject, data.text, data.html);
  };
}

export default new EmailService();