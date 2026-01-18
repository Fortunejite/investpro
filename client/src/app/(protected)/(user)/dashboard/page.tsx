"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  DollarSign, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Activity,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/redux.hook";
import { api, PagedResponse } from "@/lib/api";
import { TableLoading } from "@/components/Loading";
import type { Account } from "@/types/account";
import type { Transaction } from "@/types/transaction";

interface DashboardData {
  account: Account;
  transactions: Transaction[];
  stats: {
    totalInvested: string;
    totalProfit: string;
    activeInvestments: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppSelector((state) => state.user);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [accountResponse, transactionsResponse] = await Promise.all([
          api.get('/account'),
          api.get('/transactions')
        ]);

        // Extract transactions from the API response structure
        const transactionData = transactionsResponse.data as PagedResponse<Transaction>;
        const transactions = transactionData.data;
        
        // Calculate stats from transaction data
        const totalInvested = transactions
          .filter((t: Transaction) => t.type === 'investment')
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
        
        const totalProfit = transactions
          .filter((t: Transaction) => t.type === 'profit_payout')
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);

        const activeInvestments = transactions
          .filter((t: Transaction) => t.type === 'investment').length;

        const stats = {
          totalInvested: totalInvested.toString(),
          totalProfit: totalProfit.toString(),
          activeInvestments
        };

        setData({
          account: accountResponse.data,
          transactions: transactions,
          stats
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownToLine className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpFromLine className="h-4 w-4 text-red-500" />;
      case 'investment':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'profit_payout':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-destructive text-lg font-medium">{error}</div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.name || 'Investor'}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your investment portfolio and recent activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Available Balance */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  {showBalance ? formatCurrency(data?.account?.availableBalance || "0") : "••••••"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Locked: {showBalance ? formatCurrency(data?.account?.lockedBalance || "0") : "••••••"}
                </p>
              </>
            )}
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>

        {/* Total Invested */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(data?.stats?.totalInvested || "0")}
                </div>
                <p className="text-xs text-green-600">+12% from last month</p>
              </>
            )}
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(data?.stats?.totalProfit || "0")}
                </div>
                <p className="text-xs text-green-600">+8.2% ROI</p>
              </>
            )}
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>

        {/* Active Investments */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  {data?.stats?.activeInvestments || 0}
                </div>
                <p className="text-xs text-muted-foreground">Running investments</p>
              </>
            )}
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Start investing or manage your funds with these quick actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild className="h-16 flex-col space-y-2">
              <Link href="/deposit">
                <ArrowDownToLine className="h-6 w-6" />
                <span>Deposit</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col space-y-2">
              <Link href="/withdraw">
                <ArrowUpFromLine className="h-6 w-6" />
                <span>Withdraw</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col space-y-2">
              <Link href="/invest">
                <TrendingUp className="h-6 w-6" />
                <span>Invest</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col space-y-2">
              <Link href="/trading-signals">
                <Activity className="h-6 w-6" />
                <span>Signals</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest investment activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions">
              See All
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableLoading rows={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No transactions yet. Start by making your first deposit!
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.transactions?.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <div className="font-medium capitalize">
                              {transaction.type.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
