/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { tokenService } from "@/services/token.service";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  console.log(token ? "Cookie Found" : "No Cookie Found");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const payload = tokenService.verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = payload;
  next();
};

export const authorize = (roles: Array<'user' | 'admin' | 'trader'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
