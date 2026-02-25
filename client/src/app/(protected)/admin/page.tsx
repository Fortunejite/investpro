'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppSelector } from "@/hooks/redux.hook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowLeftRight,
  Activity,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Wallet,
  BarChart3,
  UserCheck,
} from "lucide-react";
import api, { isAxiosError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Transaction } from '@/types/transaction';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalDeposited: string;
  totalWithdrawn: string;
  netRevenue: string;
  activeInvestments: number;
  openPositions: number;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string;
  createdAt: string;
}

interface AdminDashboardData {
  stats: AdminStats;
  recentTransactions: (Transaction & { account: { user: { name: string; email: string } } })[];
  recentUsers: RecentUser[];
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

const txTypeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  deposit:                { label: 'Deposit',         color: 'text-green-600 bg-green-100 dark:bg-green-900/20',  icon: ArrowUpRight },
  withdrawal:             { label: 'Withdrawal',      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',        icon: ArrowLeftRight },
  investment:             { label: 'Investment',      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',     icon: TrendingUp },
  profit_payout:          { label: 'Profit',          color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20', icon: DollarSign },
  open_position:          { label: 'Open Position',   color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20', icon: BarChart3 },
  close_position:         { label: 'Close Position',  color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20', icon: BarChart3 },
  signal_subscription:    { label: 'Signal Sub',      color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20',    icon: Activity },
  withdrawal_cancellation:{ label: 'WD Cancelled',    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20', icon: Clock },
  withdrawal_rejected:    { label: 'WD Rejected',     color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/20',    icon: Clock },
};

const quickActions = [
  { label: 'Manage Users',        icon: Users,        href: '/admin/users',       desc: 'View & edit accounts',    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { label: 'Review Deposits',     icon: CreditCard,   href: '/admin/deposits',    desc: 'Approve pending deposits', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  { label: 'Investment Plans',    icon: TrendingUp,   href: '/admin/plans',       desc: 'Manage plan options',      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  { label: 'Withdrawals',         icon: ArrowLeftRight, href: '/admin/withdrawals', desc: 'Process requests',       color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  { label: 'Transactions',        icon: Activity,     href: '/admin/transactions', desc: 'All platform activity',  color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20' },
  { label: 'Trading Signals',     icon: BarChart3,    href: '/admin/signals',     desc: 'Publish signals',         color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
];

const AdminDashboard = () => {
  const { user } = useAppSelector((state) => state.user);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await api.get('/stats/admin');
      setData(res.data);
    } catch (err) {
      if (isAxiosError(err)) toast.error(err.response?.data?.message || 'Failed to load stats');
      else toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const stats = data?.stats;

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() ?? '—',
      sub: `${stats?.activeUsers ?? 0} active`,
      icon: Users,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600',
      trend: null,
    },
    {
      title: 'Net Revenue',
      value: stats ? formatCurrency(stats.netRevenue) : '—',
      sub: `${formatCurrency(stats?.totalDeposited ?? '0')} deposited`,
      icon: DollarSign,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600',
      trend: null,
    },
    {
      title: 'Pending Deposits',
      value: stats?.pendingDeposits?.toString() ?? '—',
      sub: 'Awaiting approval',
      icon: CreditCard,
      iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600',
      trend: null,
      alert: (stats?.pendingDeposits ?? 0) > 0,
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.pendingWithdrawals?.toString() ?? '—',
      sub: 'Pending review',
      icon: ArrowLeftRight,
      iconBg: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600',
      trend: null,
      alert: (stats?.pendingWithdrawals ?? 0) > 0,
    },
    {
      title: 'Active Investments',
      value: stats?.activeInvestments?.toLocaleString() ?? '—',
      sub: 'Currently running',
      icon: TrendingUp,
      iconBg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      trend: null,
    },
    {
      title: 'Open Positions',
      value: stats?.openPositions?.toLocaleString() ?? '—',
      sub: 'Active trades',
      icon: BarChart3,
      iconBg: 'bg-cyan-50 dark:bg-cyan-900/20',
      iconColor: 'text-cyan-600',
      trend: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening on your platform today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 py-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Administrator
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="relative overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.iconBg}`}>
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold">{card.value}</span>
                      {card.alert && (
                        <Badge variant="destructive" className="mb-0.5 text-xs">Action needed</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <div className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all duration-200 cursor-pointer text-center h-full">
                    <div className={`p-2.5 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight hidden sm:block">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Transactions + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/transactions" className="text-xs text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <TransactionRowSkeleton key={i} />)
                : data?.recentTransactions?.length === 0
                ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    No transactions yet
                  </div>
                )
                : data?.recentTransactions?.map((tx) => {
                  const cfg = txTypeConfig[tx.type] ?? { label: tx.type, color: 'text-gray-600 bg-gray-100', icon: Activity };
                  const TxIcon = cfg.icon;
                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-3">
                      <div className={`p-2 rounded-full ${cfg.color}`}>
                        <TxIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.account?.user?.name ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold shrink-0">
                        {formatCurrency(tx.amount)}
                      </span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })
              }
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              New Users
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users" className="text-xs text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                ))
                : data?.recentUsers?.length === 0
                ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    No users yet
                  </div>
                )
                : data?.recentUsers?.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <Badge
                      variant={u.status === 'active' ? 'default' : 'destructive'}
                      className="text-xs shrink-0"
                    >
                      {u.status}
                    </Badge>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Summary */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Deposited',   value: stats ? formatCurrency(stats.totalDeposited)  : '—', icon: Wallet,        color: 'text-green-600' },
              { label: 'Total Withdrawn',   value: stats ? formatCurrency(stats.totalWithdrawn)  : '—', icon: TrendingDown,  color: 'text-red-500' },
              { label: 'Net Revenue',       value: stats ? formatCurrency(stats.netRevenue)      : '—', icon: DollarSign,    color: 'text-primary' },
              { label: 'Active Users',      value: stats?.activeUsers?.toLocaleString() ?? '—',         icon: UserCheck,     color: 'text-blue-600' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="space-y-1">
                  {loading ? (
                    <>
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-7 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                        {item.label}
                      </div>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
