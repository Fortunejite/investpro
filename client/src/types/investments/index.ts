import config from '@/lib/config';

export interface Investment {
  id: string;
  status: keyof typeof config.investmentStatuses;
  createdAt: Date;
  updatedAt: Date;
  planId: number;
  amount: string;
  accountId: number;
  profit: string;
  startDate: Date;
  endDate: Date;
}

export interface InvestmentPlan {
  name: string;
  id: number;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  minAmount: number;
  durationInDays: number;
  roiPercent: number;
  payoutType: keyof typeof config.payoutTypes;
  isActive: boolean;
}
