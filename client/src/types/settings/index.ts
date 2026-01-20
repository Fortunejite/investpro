export const settingsConstants = [
  // Admin Addresses
  "btcAddress",
  "ethAddress",
  "bscAddress",
  "solAddress",

  // Telegram Settings
  "telegramBotToken",

  // Gmail SMTP Settings
  "emailUser",
  "emailPass",

  // Signal Pricing
  "monthlySignalPrice",
  "quarterlySignalPrice",
  "annualSignalPrice",
] as const;


export type SettingsData = {
  [key in typeof settingsConstants[number]]?: string;
};