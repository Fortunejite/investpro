import Bull from "bull";
import config from "@/config";
import deliverSignal from "./workers/signal.worker";

const queueConfig = {
  redis: config.redis
};

const signalDeliveryQueue = new Bull("signal-delivery-queue", queueConfig)

signalDeliveryQueue.process(deliverSignal);

const queueSignalForDelivery = async (signalId: number, opts?: { runAt?: Date }) => {
  const jobOptions: Bull.JobOptions = {}
  if (opts?.runAt) jobOptions.delay = opts.runAt.getTime() - Date.now();
  await signalDeliveryQueue.add({ signalId }, jobOptions);
}

export default queueSignalForDelivery;