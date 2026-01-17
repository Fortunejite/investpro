import Bull from "bull";
import config from "@/config";
import deliverEmail from "./workers/email.worker";

const queueConfig = {
  redis: config.redis
};

const emailDeliveryQueue = new Bull("email-delivery-queue", queueConfig)

emailDeliveryQueue.process(deliverEmail);

const queueResetEmailForDelivery = async (email: string, resetToken: string) => {
  await emailDeliveryQueue.add({ email, resetToken, emailType: 'passwordReset' });
};

export default queueResetEmailForDelivery;