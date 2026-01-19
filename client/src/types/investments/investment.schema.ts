import z from "zod";

export const createInvestmentSchema = z.object({
  planId: z.number(),
  amount: z.number().positive(),
});