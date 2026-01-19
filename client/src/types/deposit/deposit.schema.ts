import config from "@/lib/config";
import z from "zod";

export const createDepositSchema = z.object({
  chain: z.enum(config.chains),
  amount: z.number().positive(),
  txHash: z.string().max(100).optional(),
  proofUrl: z.url().optional(),
});

export const rejectDepositSchema = z.object({
  adminNote: z.string().min(1, "Admin note is required for rejection"),
});