import z from "zod";

export const createSignalSchema = z.object({
  action: z.enum(['Buy', 'Sell']),
  currency: z.string().min(1, 'Currency is required'),
  entryPrice: z.number().positive('Entry price must be positive'),
  tp1: z.number().positive('TP1 must be positive'),
  tp2: z.number().min(0, 'TP2 must be positive').optional(),
  sl: z.number().positive('Stop loss must be positive'),
  scheduledAt: z.date().optional(),
});

export const editSignalSchema = createSignalSchema;
