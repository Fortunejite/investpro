import { Queue } from "bullmq";
import { queueConfig } from ".";
import { Positions } from "@prisma/client";

const positionCopyQueue = new Queue("position-copy-queue", queueConfig);

const queuePositionForCopy = async (position: Positions) => {
  await positionCopyQueue.add("copy-position", { position });
}

export default queuePositionForCopy;