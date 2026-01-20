import { TradeSignal, TradeSignalDeliveries } from "@prisma/client";
import axios from "axios";
import { url } from ".";

const generateSignalMessage = (signal: TradeSignal): string => {
  let message = `📢 New Trade Signal Alert! 📢\n\n`;
  message += `🔹 Currency: ${signal.currency}\n`;
  message += `🔹 Action: ${signal.action.toUpperCase()}\n`;
  message += `🔹 Entry Price: ${signal.entryPrice}\n`;
  message += `🔹 Take Profit 1: ${signal.tp1}\n`;
  if (parseInt(signal.tp2 as unknown as string || '0') > 0) message += `🔹 Take Profit 2: ${signal.tp2}\n`;
  message += `🔹 Stop Loss: ${signal.sl}\n`;

  return message;
};

const sendSignalMessage = async (payload: TradeSignalDeliveries & { signal: TradeSignal }) => {
  const message = generateSignalMessage(payload.signal);

  const response = await axios.post(url, {
    chat_id: payload.telegramUserId,
    text: message,
    parse_mode: 'Markdown',
  });

  return response.data;
};

export default sendSignalMessage;
