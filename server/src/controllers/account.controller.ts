import { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/prisma";
import { createAccount as _createAccount } from "@/lib/account";

class AccountController {
  getUserAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const account = await prisma.account.findUnique({
        where: { id: userId },
      });

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      res.status(200).json(account);
    } catch (err) {
      next(err);
    }
  };

  createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const newAccount = await _createAccount(userId);

      res.status(201).json(newAccount);
    } catch (err) {
      next(err);
    }
  };

  // Admin functions
  getAllAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query;
      
      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;
      const accounts = await prisma.account.findMany({
        skip,
        take: limit,
        include: { user: true },
      });
      res.status(200).json({ data: accounts, pagination: { page, limit } });
    } catch (err) {
      next(err);
    }
  };
}

export default new AccountController();