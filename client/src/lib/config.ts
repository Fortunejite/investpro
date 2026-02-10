interface requiredEnv {
  name: string;
  key: string;
  value: string | undefined;
}

const chainInfo = {
  eth: { name: 'Ethereum', symbol: 'ETH' },
  bsc: { name: 'Binance Smart Chain', symbol: 'BSC' },
  btc: { name: 'Bitcoin', symbol: 'BTC' },
  sol: { name: 'Solana', symbol: 'SOL' },
};

const config = {
  api: {
    baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL!,
  },
  signals: {
    monthly: 'monthlySignalPrice',
    quarterly: 'quarterlySignalPrice',
    yearly: 'annualSignalPrice',
  } as const,
  chains: ['eth', 'bsc', 'btc', 'sol'] as const,
  chainInfo,
  transactionStatuses: [
    'pending',
    'approved',
    'rejected',
    'cancelled',
  ] as const,
  transactionTypes: [
    'deposit',
    'withdrawal',
    'withdrawal_cancellation',
    'withdrawal_rejected',
    'investment',
    'profit_payout',
    'signal_subscription',
    'open_position',
    'close_position',
  ] as const,
  investmentStatuses: ['active', 'inactive', 'expired', 'cancelled'] as const,
  signalDeliveryStatuses: ['queued', 'sent', 'failed'] as const,
  payoutTypes: ['daily', 'weekly', 'monthly', 'end_of_term'] as const,
  isValid: false,
};

const validateConfig = () => {
  const required: requiredEnv[] = [
    {
      name: 'Backend API URL',
      key: 'backendApiUrl',
      value: config.api.baseURL,
    },
  ];

  const missing = required.filter((item) => !item.value);

  if (missing.length > 0) {
    console.error('Missing required configuration:');
    missing.forEach((item) => {
      console.error(`- ${item.name} (${item.key})`);
    });
    return false;
  }

  return true;
};

config.isValid = validateConfig();

export default config;
