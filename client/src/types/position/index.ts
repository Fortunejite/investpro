import { Coin } from '../asset';
import { User } from '../user';

export type PositionSide = 'long' | 'short';

export type PositionStatus = 'open' | 'closed' | 'liquidated';

export interface Position {
  id: string;
  userId: number;
  coinId: string;
  side: PositionSide;
  status: PositionStatus;
  leverage: number;
  margin: string; // USD locked from user's balance (Decimal as string)
  notional: string; // margin * leverage (Decimal as string)
  entryPrice: string; // price at open (Decimal as string)
  size: string; // notional / entryPrice (for BTC qty) (Decimal as string)
  closePrice?: string; // Decimal as string
  pnl?: string; // Profit and Loss (Decimal as string)
  originalPositionId?: string; // For copied positions, reference to original position

  openAt: Date;
  expiryAt: Date;
  closedAt?: Date;

  user: User;
  coin: Coin;
  originalPosition?: Position; // For copied positions, reference to original position
  copiedPositions: Position[]; // For copied positions, reference to all copied positions
}

// For creating a new position
export interface CreatePositionRequest {
  coinId: string;
  side: PositionSide;
  leverage: number;
  margin: number; // Amount in USD to use as margin
  expiryAt: Date;
}

// Position summary for UI display
export interface PositionSummary {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalPnl: string;
  totalMargin: string;
  totalNotional: string;
}

// Position with calculated fields for UI
export interface PositionWithCalculations extends Position {
  currentPrice?: string;
  unrealizedPnl?: string;
  marginRatio?: string;
  liquidationPrice?: string;
  isProfit?: boolean;
  pnlPercentage?: string;
}

export * from './trade-form';
export * from './schema';
