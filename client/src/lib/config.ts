interface requiredEnv {
  name: string;
  key: string;
  value: string | undefined;
}

const chainInfo = {
  eth: { name: "Ethereum", symbol: "ETH" },
  bsc: { name: "Binance Smart Chain", symbol: "BNB" },
  polygon: { name: "Polygon", symbol: "MATIC" },
  sol: { name: "Solana", symbol: "SOL" },
}

const config = {
  api: {
    baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL!,
  },
  chains: ["eth", "bsc", "polygon", "sol"] as const,
  chainInfo,
  transactionStatuses: ["pending", "approved", "rejected", "cancelled"] as const,
  isValid: false,
};

const validateConfig = () => {
  const required: requiredEnv[] = [
    {
      name: "Backend API URL",
      key: "backendApiUrl",
      value: config.api.baseURL,
    },
  ];

  const missing = required.filter((item) => !item.value);

  if (missing.length > 0) {
    console.error("Missing required configuration:");
    missing.forEach((item) => {
      console.error(`- ${item.name} (${item.key})`);
    });
    return false;
  }

  return true;
};

config.isValid = validateConfig();

export default config;
