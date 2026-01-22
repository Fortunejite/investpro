import { Queue } from "bullmq";
import { queueConfig } from ".";

const emailDeliveryQueue = new Queue("email-delivery-queue", queueConfig);

const queueResetEmailForDelivery = async (email: string, resetToken: string) => {
  await emailDeliveryQueue.add("password-reset", { email, resetToken, emailType: 'passwordReset' });
};

export default queueResetEmailForDelivery;