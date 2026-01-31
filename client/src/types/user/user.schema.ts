import z from "zod";

export const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  email: z.email(),
  token: z.string().length(6),
  newPassword: z.string().min(6),
});

export const updateUserProfile = z.object({
  name: z.string().min(2).optional(),
  telegramUserId: z.string().optional(),
});

export const createTradingProfileSchema = z.object({
  userId: z.number(),
  bio: z.string().max(255),
  profitSharePercent: z.number().min(0).max(100),
  totalProfit: z.number().min(0),
  winRate: z.number().min(0).max(100),
  totalTrades: z.number().min(0),
  successfulTrades: z.number().min(0),
  minCapital: z.number().min(0),
});

export const updateTradingProfileSchema = createTradingProfileSchema.partial().omit({ userId: true });