import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { tokenService } from "@/services/tokenService";

const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

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
      const newUser = await prisma.user.create({
        data: { email, name, hashed_password: hashPassword },
      });
  
      res.status(201).json({ message: "User registered successfully", userId: newUser.id });
    } catch (error) {
      next(error);
    }
  };

  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const { hashed_password, ...userData } = user;

      const isPasswordValid = await bcrypt.compare(password, hashed_password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "User is not active" });
      }

      const token = tokenService.generateAccessToken(userData);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      next(error);
    }
  };

  verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.token;
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
}

export default new AuthController();