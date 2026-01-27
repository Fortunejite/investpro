import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { tokenService } from "@/services/tokenService";
import { createAccount } from "@/lib/account";
import queueResetEmailForDelivery from "@/queues/email.queues";
import { User } from "@prisma/client";

// Cookie configuration helper
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    // For production, try both strategies to maximize compatibility
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
      // Only set domain if explicitly configured, otherwise let browser handle it
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    };
  } else {
    // Development settings
    return {
      httpOnly: true,
      secure: false,
      sameSite: "lax" as const,
      path: "/",
    };
  }
};

const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.email(),
});

const resetPasswordSchema = z.object({
  email: z.email(),
  token: z.string().length(6),
  newPassword: z.string().min(6),
});

const updateUserProfile = z.object({
  name: z.string().min(2).optional(),
  telegramUserId: z.string().trim().optional(),
});

const updatePasswordSchema = z.object({
  newPassword: z.string().min(6),
  currentPassword: z.string().min(6),
});

const login = async (res: Response, userData: Omit<User, "hashed_password" | "refreshToken">, rememberMe: boolean) => {
  const token = tokenService.generateAccessToken(userData);
  const refreshToken = tokenService.generateRefreshToken(userData.id, rememberMe);

  await prisma.user.update({ where: { id: userData.id }, data: { refreshToken } });

  const cookieOptions = getCookieOptions();
  
  console.log('Setting cookies with options:', {
    ...cookieOptions,
    environment: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL,
    cookieDomain: process.env.COOKIE_DOMAIN || 'not-set'
  });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  // Primary cookie strategy
  res.cookie("accessToken", token, { 
    ...cookieOptions,
    path: "/",
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    path: "/auth/refresh",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 7 or 30 days
  });
}

class AuthController {
  registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, password } = registerSchema.parse(req.body);
  
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashPassword = await bcrypt.hash(password, 10);
      // Create new user
      const { hashed_password, refreshToken, ...newUser } = await prisma.user.create({
        data: { email, name, hashed_password: hashPassword },
      });

      await createAccount(newUser.id);
      await login(res, newUser, false);

      res.status(201).json({ message: "User registered successfully", userId: newUser.id });
    } catch (error) {
      next(error);
    }
  };

  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, rememberMe } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: "Email does not exists" });
      }

      const { hashed_password, refreshToken: _, ...userData } = user;

      const isPasswordValid = await bcrypt.compare(password, hashed_password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Password incorrect" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "User is not active. Contact admin" });
      }

      await login(res, userData, Boolean(rememberMe));
      
      res.status(200).json({ message: "Login successful", user: userData });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.accessToken;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payload = tokenService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.status(200).json({ message: "Token is valid", user: payload });
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const updateData = updateUserProfile.parse(req.body);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      const { hashed_password, refreshToken, ...userData } = updatedUser;
      res.status(200).json({ message: "User updated successfully", user: userData });
    } catch (error) {
      next(error);
    }
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
      if (currentPassword === newPassword) {
        return res.status(400).json({ message: "New password must be different from current password" });
      }
      const user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.hashed_password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current Password Incorrect" });
      }
      const hashed_password = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({
        where: { id: userId },
        data: { hashed_password },
      });
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        console.log('No refresh token found in cookies or headers');
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payload = tokenService.verifyRefreshToken(refreshToken);
      if (!payload) {
        console.log('Refresh token verification failed');
        return res.status(401).json({ message: "Unauthorized" });
      }

      const existingUser = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!existingUser || existingUser.refreshToken !== refreshToken) {
        console.log('User not found or refresh token mismatch');
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { hashed_password, refreshToken: _, ...userData } = existingUser;
      await login(res, userData, payload.rememberMe);

      res.status(200).json({ message: "Token refreshed" });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const resetToken = tokenService.generateResetToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { forgetPasswordToken: resetToken, resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000) }, // 15 minutes expiry
      });

      await queueResetEmailForDelivery(email, resetToken);
      res.status(200).json({ message: "Password reset request sent" });
    } catch (err) {
      next(err);
    }
  }

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { forgetPasswordToken: token } });
      if (!user) {
        return res.status(404).json({ message: "Invalid Reset Code" });
      }

      if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      const hashed_password = await bcrypt.hash(newPassword, 10);

      const { hashed_password: _, refreshToken: __, ...updatedUser } = await prisma.user.update({
        where: { id: user.id },
        data: { hashed_password, forgetPasswordToken: null, resetTokenExpiry: null },
      });

      res.status(200).json({ message: "Password reset successful", user: updatedUser });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();