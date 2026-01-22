import { redisConnection } from "@/lib/redis";
import { QueueOptions } from "bullmq";

export const queueConfig: QueueOptions = {
  // cast to any to work around duplicate ioredis types between project and bullmq's dependency
  connection: redisConnection as unknown as any,
};