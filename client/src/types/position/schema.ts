import z from "zod";

// Form validation schema
export const tradeFormSchema = z.object({
  coinId: z.string(),
  side: z.enum(['buy', 'sell']),
  margin: z.number().min(10),
  leverage: z.number().min(1).max(100),
  durationMinutes: z
    .number()
    .min(1)
    .max(7 * 24 * 60), // 1 minute to 7 days
});