import dotenv from 'dotenv';

dotenv.config();

interface requiredEnv {
  name: string;
  key: string;
  value: string | undefined;
}

const config = {
  port: process.env.PORT || 8000,
  clientUrl: process.env.CLIENT_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  refreshToken: process.env.REFRESH_TOKEN!,
  databaseUrl: process.env.DATABASE_URL!,
  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!),
    // password: process.env.REDIS_PASSWORD!,
  },
  signals: {
    monthly: 'monthlySignalPrice',
    quarterly: 'quarterlySignalPrice',
    yearly: 'annualSignalPrice',
  } as const,
  chains: ['eth', 'bsc', 'btc', 'sol'] as const,
  coinIds: {
    eth: '80',
    btc: '90',
    bsc: '2710',
    sol: '48543',
  },
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
  ] as const,
  investmentStatuses: ['active', 'inactive', 'expired', 'cancelled'] as const,
  isValid: false,
};

const validateConfig = () => {
  const required: requiredEnv[] = [
    {
      name: 'Client URL',
      key: 'clientUrl',
      value: config.clientUrl,
    },
    {
      name: 'JWT Secret',
      key: 'jwtSecret',
      value: config.jwtSecret,
    },
    {
      name: 'Refresh Token',
      key: 'refreshToken',
      value: config.refreshToken,
    },
    {
      name: 'Database URL',
      key: 'databaseUrl',
      value: config.databaseUrl,
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
