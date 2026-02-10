import { JobsOptions, Queue } from "bullmq";
import { queueConfig } from ".";

const signalDeliveryQueue = new Queue("signal-delivery-queue", queueConfig);

const queueSignalForDelivery = async (signalId: number, opts?: { runAt?: Date }) => {
  const jobOptions: JobsOptions = {}
  if (opts?.runAt) jobOptions.delay = opts.runAt.getTime() - Date.now();
  await signalDeliveryQueue.add("telegram-signal", { signalId }, jobOptions);
}

export default queueSignalForDelivery;