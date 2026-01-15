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
}

export default new AccountController();