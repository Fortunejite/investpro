import { _getSettingsByKey } from "@/controllers/settings.controller";

export const getUrl = async () => {
  const botToken = await _getSettingsByKey('telegramBotToken')
  if (!botToken) return null;
  return 'https://api.telegram.org/bot' + botToken + '/sendMessage'
};

export { default as sendSignalMessage } from './signal';