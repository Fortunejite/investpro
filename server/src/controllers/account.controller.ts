import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { createAccount as _createAccount } from '@/lib/account';
import z from 'zod';

const adminGetAllAccountsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),

  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'banned']).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

class AccountController {
  getUserAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const account = await prisma.account.findUnique({
        where: { id: userId },
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
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
      const queryParams = adminGetAllAccountsSchema.parse(req.query);

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // filters
      const { search, status, role } = queryParams;

      const where = {
        user: {
          ...(search && {
            name: { contains: search, mode: 'insensitive' },
            email: { contains: search, mode: 'insensitive' },
          }),
          ...(status && { status }),
          ...(role && { role }),
        },
      } as any;
      const [accounts, totalCount] = await Promise.all([
        await prisma.account.findMany({
          where,
          skip,
          take: limit,
          include: { user: true },
        }),
        await prisma.account.count({ where }),
      ]);
      res.status(200).json({ data: accounts, pagination: { page, limit, total: totalCount } });
    } catch (err) {
      next(err);
    }
  };
}

export default new AccountController();
