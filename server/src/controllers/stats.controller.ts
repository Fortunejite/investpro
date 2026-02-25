import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';

class StatsController {
  // User dashboard stats
  getUserStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;

      const [account, investments, positions, recentTransactions] = await Promise.all([
        prisma.account.findUnique({ where: { id: userId } }),
        prisma.investment.findMany({
          where: { accountId: userId },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.positions.findMany({
          where: { userId },
          include: { coin: true },
          orderBy: { openAt: 'desc' },
          take: 5,
        }),
        prisma.transaction.findMany({
          where: { accountId: userId },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
      ]);

      const activeInvestments = investments.filter(i => i.status === 'active');
      const totalInvested = investments
        .filter(i => i.status === 'active')
        .reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0);
      const totalProfit = investments
        .reduce((sum, i) => sum + parseFloat(i.profit.toString()), 0);

      const closedPositions = await prisma.positions.findMany({
        where: { userId, status: 'closed' },
        select: { pnl: true },
      });
      const totalTradingPnl = closedPositions.reduce(
        (sum, p) => sum + parseFloat(p.pnl?.toString() || '0'),
        0,
      );

      const openPositions = await prisma.positions.count({
        where: { userId, status: 'open' },
      });

      res.json({
        account,
        stats: {
          totalInvested: totalInvested.toString(),
          totalProfit: totalProfit.toString(),
          activeInvestments: activeInvestments.length,
          openPositions,
          totalTradingPnl: totalTradingPnl.toString(),
        },
        recentTransactions,
        recentPositions: positions,
      });
    } catch (err) {
      next(err);
    }
  };

  // Admin dashboard stats
  getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [
        totalUsers,
        activeUsers,
        pendingDeposits,
        pendingWithdrawals,
        totalDepositsResult,
        totalWithdrawalsResult,
        activeInvestments,
        openPositions,
        recentTransactions,
        recentUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'active' } }),
        prisma.deposit.count({ where: { status: 'pending' } }),
        prisma.withdrawal.count({ where: { status: 'pending' } }),
        prisma.deposit.aggregate({
          _sum: { amount: true },
          where: { status: 'approved' },
        }),
        prisma.withdrawal.aggregate({
          _sum: { amount: true },
          where: { status: 'approved' },
        }),
        prisma.investment.count({ where: { status: 'active' } }),
        prisma.positions.count({ where: { status: 'open' } }),
        prisma.transaction.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { account: { include: { user: true } } },
        }),
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, email: true, status: true, role: true, createdAt: true },
        }),
      ]);

      const totalDeposited = parseFloat(totalDepositsResult._sum.amount?.toString() || '0');
      const totalWithdrawn = parseFloat(totalWithdrawalsResult._sum.amount?.toString() || '0');

      res.json({
        stats: {
          totalUsers,
          activeUsers,
          pendingDeposits,
          pendingWithdrawals,
          totalDeposited: totalDeposited.toString(),
          totalWithdrawn: totalWithdrawn.toString(),
          netRevenue: (totalDeposited - totalWithdrawn).toString(),
          activeInvestments,
          openPositions,
        },
        recentTransactions,
        recentUsers,
      });
    } catch (err) {
      next(err);
    }
  };
}

export default new StatsController();
