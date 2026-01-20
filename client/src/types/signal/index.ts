import config from '@/lib/config';
import { User } from '../user';

export * from './subscription';

export interface Signal {
  id: number;
  action: 'Buy' | 'Sell';
  currency: string;
  entryPrice: string;
  tp1: string;
  tp2: string | null;
  sl: string;
  status: 'published'
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
}

export interface SignalDelivery {
  id: string;
  signalId: string;
  userId: number;
  telegramUserId: string;
  status: typeof config.signalDeliveryStatuses[number];
  error?: string;
  attempts: number;
  lastAttempt?: Date;
  createdAt: Date;
}

export interface SignalDeliveryWithUser extends SignalDelivery {
  user: User;
}
