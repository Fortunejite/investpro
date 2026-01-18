import config from "@/lib/config";

export interface Subscription {
  id: number;
  userId: number;
  plan: keyof typeof config.signals;
  isActive: boolean;
  startedAt: Date;
  endedAt: Date | null;
}
