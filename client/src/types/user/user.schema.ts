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