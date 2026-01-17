export const settingsConstants = [
  // Admin Addresses
  "btcAddress",
  "ethAddress",
  "bnbAddress",
  "solAddress",

  // Telegram Settings
  "telegramBotToken"
] as const;


export type SettingsData = {
  [key in typeof settingsConstants[number]]?: string;
};