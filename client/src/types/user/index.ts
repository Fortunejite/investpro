import { Account } from '../account';
import { Asset } from '../asset';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'trader';
  status: 'active' | 'inactive' | 'banned';
  telegramUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  account?: Account;
  assets?: Asset[];
  tradingProfile?: TradingProfile;
}

export interface TradingProfile {
  id: number;
  bio: string | null;
  profitSharePercent: string;
  totalProfit: string;
  winRate: string;
  totalTrades: number;
  successfulTrades: number;
  minCapital: string;
  createdAt: Date;
  updatedAt: Date;
  followers?: TraderFollower[];
  user?: User;
}

export interface TraderFollower {
  id: number;
  traderId: number;
  userId: number;
  createdAt: Date;
}

export interface UserFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'banned' | 'all';
  role?: 'user' | 'admin' | 'trader' | 'all';
  page?: number;
  limit?: number;
}

export * from './user.schema';