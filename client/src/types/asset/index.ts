export interface Coin {
  symbol: string;
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  nameId: string;
  img: string;
  rank: number;
}
export interface Asset {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  coinId: string;
  availableBalance: string;
  lockedBalance: string;
  coin: Coin;
}

export interface Swap {
  id: string;
  createdAt: Date;
  userId: number;
  fromAssetId: number;
  toAssetId: number;
  amount: string;
  exchangeRate: string;

  fromAsset: Asset & { coin: Coin };
  toAsset: Asset & { coin: Coin };
}
