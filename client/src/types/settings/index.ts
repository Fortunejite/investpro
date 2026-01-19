export const settingsConstants = [
  // Admin Addresses
  "btcAddress",
  "ethAddress",
  "bsc",
  "solAddress",

  // Telegram Settings
  "telegramBotToken"
] as const;


export type SettingsData = {
  [key in typeof settingsConstants[number]]?: string;
};