import { prisma } from "@/lib/prisma";
import { Response, Request, NextFunction } from "express";

class UserController {
  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query;

      // pagination
      const page = parseInt(queryParams.page as string) || 1;
      const limit = parseInt(queryParams.limit as string) || 10;
      const skip = (page - 1) * limit;

      // filters
      const status = queryParams.status as string;
      const role = queryParams.role as string;
      const search = queryParams.search as string;

      const where: any = {};
      if (status) where.status = status;
      if (role) where.role = role;
      if (search) where.name = { contains: search, mode: "insensitive" };
      if (search) where.email = { contains: search, mode: "insensitive" };

      const [users, totalCount] = await Promise.all([
        await prisma.user.findMany({
          where,
          include: { account: true, assets: true, tradingProfile: true },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        await prisma.user.count({ where }),
      ]);

      res.status(200).json({ data: users, pagination: { page, limit, total: totalCount } });
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id as string);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { account: true, assets: true, tradingProfile: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  banUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id as string);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: "banned" },
      });

      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  };

  unbanUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id as string);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: "active" },
      });

      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  };
}

export default new UserController();