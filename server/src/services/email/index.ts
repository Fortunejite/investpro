import nodemailer from 'nodemailer';
import config from '@/config';
import { forgotPasswordEmail } from './forgotPassword';
import { _getSettingsByKey } from '@/controllers/settings.controller';

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  const emailUser = await _getSettingsByKey('emailUser')
  const emailPass = await _getSettingsByKey('emailPass')
  if (!emailUser || !emailPass) return;
  const mailOptions = {
    from: emailUser,
    to,
    subject,
    text,
    html,
  };

  const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

  await transporter.sendMail(mailOptions);
};

class EmailService {
  sendPasswordResetEmail = async (to: string, token: string) => {
    const data = forgotPasswordEmail(token, to);
    await sendEmail(to, data.subject, data.text, data.html);
  };
}

export default new EmailService();