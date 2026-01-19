import config from "@/config";
import axios from "axios";

export const getPriceInUsd = async (coin: typeof config.chains[number]): Promise<number> => {
  const coinId = config.coinIds[coin];
  try {
    const response = await axios.get(`https://api.coinlore.net/api/ticker/?id=${coinId}`);
    return response.data[0]?.price_usd || 0;
  } catch (error) {
    console.error(`Error fetching price for ${coinId}:`, error);
    return 0;
  }
};