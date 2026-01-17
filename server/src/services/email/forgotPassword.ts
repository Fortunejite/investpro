import config from "@/config";

export const forgotPasswordEmail = (resetToken: string) => {
  const resetLink = `${config.clientUrl}/reset-password?token=${resetToken}`;
  return {
    subject: 'Password Reset Request',
    text: `You have requested to reset your password. Use the following token to reset your password: ${resetToken}. This token is valid for 15 minutes.`,
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4CAF50;">Password Reset Request</h2>
      <p>We received a request to reset your password. Use the code below to reset it:</p>
      <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; display: inline-block; margin: 20px 0;">
        <strong style="font-size: 24px;">${resetToken}</strong>
      </div>
      <p>You can also reset your password by clicking the link below:</p>
      <p><a href="${resetLink}" style="color: #4CAF50;">Reset Your Password</a></p>
      <p>This code is valid for the next 15 minutes. If you did not request a password reset, please ignore this email.</p>
      <p>Best regards,<br/>The Investment Site Team</p>
    </div>
  `,
  };
};