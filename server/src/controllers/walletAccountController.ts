import { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/prisma";
import { createWalletAccount as _createWalletAccount } from "@/lib/walletAccounts";
import config from "@/config";

class WalletAccountController {
  getUserWalletAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const queryParams = req.query;

      // Filters
      const chain = queryParams.chain as
        | (typeof config.chains)[number]
        | undefined;
      if (chain && !config.chains.includes(chain)) {
        return res.status(400).json({ message: "Invalid chain parameter" });
      }

      const walletAccounts = await prisma.walletAccount.findMany({
        where: { userId, chain },
      });
      res.status(200).json(walletAccounts);
    } catch (err) {
      next(err);
    }
  };

  getWalletAccountById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const walletAccountId = req.params.id as string;

      const walletAccount = await prisma.walletAccount.findUnique({
        where: { id: walletAccountId },
      });

      if (!walletAccount || walletAccount.userId !== userId) {
        return res.status(404).json({ message: "Wallet account not found" });
      }

      res.status(200).json(walletAccount);
    } catch (err) {
      next(err);
    }
  };

  createWalletAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const newWalletAccount = await _createWalletAccount(userId, req.body);

      res.status(201).json(newWalletAccount);
    } catch (err) {
      next(err);
    }
  };
}

export default new WalletAccountController();