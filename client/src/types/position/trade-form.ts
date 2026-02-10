export type PositionSide = 'buy' | 'sell';

// Trading pair information
export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
  minLeverage: number;
  maxLeverage: number;
  minCollateral: number;
  maxCollateral: number;
  tickSize: string; // Minimum price increment
  stepSize: string; // Minimum quantity increment
  isActive: boolean;
}

// Market data for a trading pair
export interface MarketData {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  lastUpdate: Date;
}

// Exchange information
export interface Exchange {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  supportedPairs: string[];
}

// Chart timeframe options
export type ChartTimeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

// Chart configuration
export interface ChartConfig {
  symbol: string;
  exchange: string;
  timeframe: ChartTimeframe;
  theme: 'light' | 'dark';
}

// Trade execution response
export interface TradeResponse {
  success: boolean;
  positionId?: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Available time options for positions (in minutes)
export const POSITION_TIME_OPTIONS = [
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 1440 },
  { label: '1 week', value: 10080 },
] as const;

// Default leverage options
export const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100] as const;

// Popular trading pairs
export const POPULAR_PAIRS = [
  'BTCUSDT',
  'ETHUSDT', 
  'BNBUSDT',
  'ADAUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOTUSDT',
  'AVAXUSDT',
] as const;
