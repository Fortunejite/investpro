// Convert timeframe format (1h -> 60, 1d -> 1D, etc.)
export const convertTimeframe = (tf: string) => {
  switch (tf) {
    case "1m": return "1";
    case "5m": return "5";
    case "15m": return "15";
    case "30m": return "30";
    case "1h": return "60";
    case "4h": return "240";
    case "1d": return "1D";
    case "1w": return "1W";
    case "1M": return "1M";
    default: return "60";
  }
};

export const getAssetSymbol = (asset: string) => {
  return `${asset}USDT`;
};

// Convert symbol format (BTC -> BINANCE:BTCUSDT)
export const formatSymbol = (asset: string, ex: string) => {
  const exchangeMap: Record<string, string> = {
    binance: "BINANCE",
    coinbase: "COINBASE",
    kraken: "KRAKEN",
    bitfinex: "BITFINEX",
    bybit: "BYBIT",
  };
  
  const exchangePrefix = exchangeMap[ex] || "BINANCE";
  return `${exchangePrefix}:${asset}USDT`;
};