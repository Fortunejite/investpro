import config from "@/config";
import axios from 'axios';

interface Ticker {
  id: string;
  symbol: string;
  name: string;
  nameid: string;
  img: string;
  rank: number;
  price_usd: string;
  percent_change_24h: string;
  percent_change_1h: string;
  percent_change_7d: string;
  market_cap_usd: string;
  volume24: string;
  volume24a: string;
  csupply: string;
  tsupply: string;
  msupply: string;
}

const api = axios.create({
  baseURL: 'https://api.coinlore.net/api',
});

const getCoinImageUrl = (nameId: string) => {
  return `https://www.coinlore.com/img/50x50/${nameId}.png`;
};

export const getAllCoins = async (start: number, limit: number) => {
  const { data: responseData } = await api.get(`/tickers/?start=${start}&limit=${limit}`);
  // Add image URL to each ticker
  responseData.data = responseData.data.map((ticker: Ticker) => ({
    ...ticker,
    img: getCoinImageUrl(ticker.nameid),
  }));
  return {
    data: responseData.data as Ticker[],
    pagination: {
      total: Math.ceil(responseData.info.coins_num / limit),
      page: Math.ceil(start / limit) + 1,
      limit,
    },
  };
};

export const getCoinById = async (id: string) => {
  const { data: responseData } = await api.get(`/ticker/?id=${id}`);
  const ticker: Ticker = responseData[0];
  // Add image URL to the ticker
  ticker.img = getCoinImageUrl(ticker.nameid);
  return ticker;
};


export const getPriceInUsd = async (coin: typeof config.chains[number]): Promise<number> => {
  const coinId = config.coinIds[coin];
  try {
    const response = await api.get(`/ticker/?id=${coinId}`);
    return response.data[0]?.price_usd || 0;
  } catch (error) {
    console.error(`Error fetching price for ${coinId}:`, error);
    return 0;
  }
};