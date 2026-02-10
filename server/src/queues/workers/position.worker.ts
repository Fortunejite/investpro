import { Job, Worker } from 'bullmq';
import { queueConfig } from "..";
import { Positions } from "@prisma/client";
import positionService from "@/services/position.service";

const copyPosition = async (job: Job) => {
  const position = job.data.position as Positions;
  await positionService.copyPosition(position);
};

const positionWorker = new Worker("position-copy-queue", async (job) => {
  await copyPosition(job);
}, queueConfig);

positionWorker.on('completed', (job) => {
  console.log(`Position job ${job.id} completed`);
});

positionWorker.on('failed', (job, err) => {
  console.error(`Position job ${job?.id} failed:`, err);
});

export default positionWorker;