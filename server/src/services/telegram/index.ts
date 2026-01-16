import config from "@/config";

export const url = 'https://api.telegram.org/bot' + config.telegram.botToken + '/sendMessage';

export { default as sendSignalMessage } from './signal';