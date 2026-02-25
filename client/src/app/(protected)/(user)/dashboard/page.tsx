"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  Eye,
  EyeOff,
  Wallet,
  BarChart3,
  RefreshCw,
  ArrowLeftRight,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/hooks/redux.hook";
import api, { isAxiosError } from "@/lib/api";
import type { Account } from "@/types/account";
import type { Transaction } from "@/types/transaction";
import type { Position } from "@/types/position";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface UserStats {
  totalInvested: string;
  totalProfit: string;
  activeInvestments: number;
  openPositions: number;
  totalTradingPnl: string;
}

interface UserDashboardData {
  account: Account;
  stats: UserStats;
  recentTransactions: Transaction[];
  recentPositions: Position[];
}

// ─── Skeleton helpers ──────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function TxRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

// ─── Transaction type config ───────────────────────────────────────────────────
const txConfig: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  deposit:                 { label: 'Deposit',        icon: ArrowDownToLine, bg: 'bg-green-100 dark:bg-green-900/20',   text: 'text-green-600' },
  withdrawal:              { label: 'Withdrawal',     icon: ArrowUpFromLine, bg: 'bg-red-100 dark:bg-red-900/20',       text: 'text-red-600' },
  investment:              { label: 'Investment',     icon: TrendingUp,      bg: 'bg-blue-100 dark:bg-blue-900/20',     text: 'text-blue-600' },
  profit_payout:           { label: 'Profit',         icon: DollarSign,      bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-600' },
  open_position:           { label: 'Open Trade',     icon: BarChart3,       bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600' },
  close_position:          { label: 'Close Trade',    icon: BarChart3,       bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600' },
  signal_subscription:     { label: 'Signal Sub',     icon: Activity,        bg: 'bg-cyan-100 dark:bg-cyan-900/20',    text: 'text-cyan-600' },
  withdrawal_cancellation: { label: 'WD Cancelled',   icon: Clock,           bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600' },
  withdrawal_rejected:     { label: 'WD Rejected',    icon: Clock,           bg: 'bg-rose-100 dark:bg-rose-900/20',    text: 'text-rose-600' },
};

// ─── Quick actions ─────────────────────────────────────────────────────────────
const quickActions = [
  { label: 'Deposit',     icon: ArrowDownToLine, href: '/deposit',         color: 'bg-green-50 dark:bg-green-900/20 text-green-700 border-green-200 dark:border-green-800' },
  { label: 'Withdraw',    icon: ArrowUpFromLine, href: '/withdrawal',      color: 'bg-red-50 dark:bg-red-900/20 text-red-700 border-red-200 dark:border-red-800' },
  { label: 'Invest',      icon: TrendingUp,      href: '/investments',     color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 border-blue-200 dark:border-blue-800' },
  { label: 'Markets',       icon: BarChart3,       href: '/markets',           color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 border-purple-200 dark:border-purple-800' },
  { label: 'Swap',        icon: ArrowLeftRight,  href: '/swap',            color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 border-cyan-200 dark:border-cyan-800' },
  { label: 'Signals',     icon: Activity,        href: '/trading-signals', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 border-orange-200 dark:border-orange-800' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.user);
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await api.get('/stats/user');
      setData(res.data);
    } catch (err) {
      if (isAxiosError(err)) toast.error(err.response?.data?.message || 'Failed to load dashboard');
      else toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const account = data?.account;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Investor'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your portfolio and recent activity.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Hero + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance — hero card */}
        <Card className="sm:col-span-2 relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowBalance((v) => !v)}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {showBalance ? formatCurrency(account?.availableBalance ?? '0') : '••••••'}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Locked:{' '}
                  <span className="font-medium">
                    {showBalance ? formatCurrency(account?.lockedBalance ?? '0') : '••••'}
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-32" /><Skeleton className="h-3 w-20" /></div>
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats?.totalProfit ?? '0')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Investment returns</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Trading PnL */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trading P&L</CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-32" /><Skeleton className="h-3 w-20" /></div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${parseFloat(stats?.totalTradingPnl ?? '0') >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {parseFloat(stats?.totalTradingPnl ?? '0') >= 0 ? '+' : ''}
                  {formatCurrency(stats?.totalTradingPnl ?? '0')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Closed positions</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Invested',      value: formatCurrency(stats?.totalInvested ?? '0'),          icon: TrendingUp,  bg: 'bg-blue-50 dark:bg-blue-900/20',    iconColor: 'text-blue-600',   sub: 'Across all plans' },
          { title: 'Active Investments',  value: stats?.activeInvestments?.toLocaleString() ?? '0',    icon: Activity,    bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-600', sub: 'Running now' },
          { title: 'Open Positions',      value: stats?.openPositions?.toLocaleString() ?? '0',        icon: BarChart3,   bg: 'bg-cyan-50 dark:bg-cyan-900/20',    iconColor: 'text-cyan-600',   sub: 'Active trades' },
          { title: 'Locked Balance',      value: formatCurrency(account?.lockedBalance ?? '0'),        icon: Wallet,      bg: 'bg-orange-50 dark:bg-orange-900/20', iconColor: 'text-orange-600', sub: 'In use' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{item.title}</CardTitle>
                <div className={`p-1.5 rounded-lg ${item.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-3 w-16" /></div>
                ) : (
                  <>
                    <div className="text-xl font-bold">{item.value}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <div className={`flex flex-col items-center gap-2 p-3 rounded-xl border hover:opacity-80 transition-all duration-200 cursor-pointer ${action.color}`}>
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{action.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transactions + Recent Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Transactions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" className="text-xs text-muted-foreground flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <TxRowSkeleton key={i} />)
                : !data?.recentTransactions?.length
                ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No transactions yet.{' '}
                    <Link href="/deposit" className="text-primary underline-offset-4 hover:underline">
                      Make your first deposit
                    </Link>
                  </div>
                )
                : data.recentTransactions.map((tx) => {
                  const cfg = txConfig[tx.type] ?? { label: tx.type, icon: Activity, bg: 'bg-muted', text: 'text-foreground' };
                  const Icon = cfg.icon;
                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-3">
                      <div className={`p-2 rounded-full ${cfg.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cfg.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold shrink-0">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })
              }
            </div>
          </CardContent>
        </Card>

        {/* Recent Positions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Recent Trades
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/trades" className="text-xs text-muted-foreground flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
                : !data?.recentPositions?.length
                ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No trades yet.{' '}
                    <Link href="/trades" className="text-primary underline-offset-4 hover:underline">
                      Start trading
                    </Link>
                  </div>
                )
                : data.recentPositions.map((pos) => {
                  const isLong = pos.side === 'long';
                  const pnl = parseFloat(pos.pnl ?? '0');
                  const isProfit = pnl >= 0;
                  return (
                    <Link key={pos.id} href={`/trades/${pos.id}`}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className={`p-1.5 rounded-lg text-xs font-bold w-8 h-8 flex items-center justify-center shrink-0 ${isLong ? 'bg-green-100 dark:bg-green-900/20 text-green-700' : 'bg-red-100 dark:bg-red-900/20 text-red-700'}`}>
                          {isLong ? 'L' : 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{pos.coin?.name ?? pos.coinId}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={pos.status === 'open' ? 'default' : 'secondary'}
                              className="text-xs h-4 px-1"
                            >
                              {pos.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{pos.leverage}x</span>
                          </div>
                        </div>
                        {pos.pnl && (
                          <span className={`text-sm font-mono font-bold shrink-0 ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                            {isProfit ? '+' : ''}{formatCurrency(pos.pnl)}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
