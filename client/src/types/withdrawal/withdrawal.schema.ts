import config from "@/lib/config";
import z from "zod";

export const createWithdrawalSchema = z.object({
  chain: z.enum(config.chains),
  amount: z.number().positive().min(50, "Minimum withdrawal amount is $50.00"),
  destinationAddress: z.string().min(10).max(100),
});