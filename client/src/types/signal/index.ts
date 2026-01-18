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
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}