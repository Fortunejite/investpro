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
  databaseUrl: process.env.DATABASE_URL!,
  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!),
    // password: process.env.REDIS_PASSWORD!,
  },
  email: {
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  },
  signals: {
    monthly: 100,
    quarterly: 200,
    yearly: 300
  } as const,
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
  },
  chains: ["eth", "bsc", "polygon", "sol"] as const,
  transactionStatuses: ["pending", "approved", "rejected", "cancelled"] as const,
  transactionTypes: ["deposit", "withdrawal", "investment", "profit_payout"] as const,
  investmentStatuses: ["active", "inactive", "expired", "cancelled"] as const,
  isValid: false,
}

const validateConfig = () => {
  const required: requiredEnv[] = [
    {
      name: "Client URL",
      key: "clientUrl",
      value: config.clientUrl,
    },
    {
      name: "JWT Secret",
      key: "jwtSecret",
      value: config.jwtSecret,
    },
    {
      name: "Database URL",
      key: "databaseUrl",
      value: config.databaseUrl,
    }
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