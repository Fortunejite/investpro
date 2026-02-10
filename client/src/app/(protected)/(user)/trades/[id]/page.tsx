'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { isAxiosError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Loading from '@/components/Loading';
import { Position } from '@/types/position';

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;
  
  const [trade, setTrade] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTradeDetails = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await api.get(`/positions/${tradeId}`);
      setTrade(response.data);

    } catch (error) {
      console.error('Error fetching trade details:', error);
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to load trade details';
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError('Failed to load trade details');
        toast.error('Failed to load trade details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tradeId]);

  useEffect(() => {
    if (tradeId) {
      fetchTradeDetails();
    }
  }, [tradeId, fetchTradeDetails]);

  const handleRefresh = () => {
    fetchTradeDetails(true);
  };

  const handleClosePosition = async () => {
    if (!trade || trade.status !== 'open') return;

    try {
      await api.post(`/positions/${tradeId}/close`);
      toast.success('Position closed successfully');
      fetchTradeDetails();
    } catch (error) {
      console.error('Error closing position:', error);
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to close position');
      } else {
        toast.error('Failed to close position');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'liquidated':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'long' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  const getPnlColor = (pnl: string) => {
    const pnlValue = parseFloat(pnl);
    return pnlValue >= 0 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'liquidated':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !trade) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trades
          </Button>
        </div>
        
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <div>
                <h2 className="text-xl font-semibold text-destructive mb-2">
                  {error || "Trade not found"}
                </h2>
                <p className="text-muted-foreground mb-4">
                  We couldn&apos;t load the details for this trade.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => fetchTradeDetails()} variant="outline">
                    Try Again
                  </Button>
                  <Button onClick={() => router.push('/trades')} variant="default">
                    Back to Trades
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trades
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Trade Details
            </h1>
            <p className="text-muted-foreground">
              {trade.coin.name} • {trade.side.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trade.status === 'open' && (
            <Button 
              onClick={handleClosePosition}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Close Position
            </Button>
          )}
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Trade Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trade Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(trade.status)}
                  Trade Overview
                </div>
                <Badge className={getStatusColor(trade.status)}>
                  {trade.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Asset</p>
                  <p className="font-semibold text-lg">
                    {trade.coin.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Side</p>
                  <Badge className={getSideColor(trade.side)}>
                    {trade.side.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-mono font-semibold">
                    {parseFloat(trade.size).toFixed(6)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Leverage</p>
                  <p className="font-semibold">
                    {trade.leverage}x
                  </p>
                </div>
              </div>

              <Separator />

              {/* Price Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Entry Price</p>
                  <p className="font-mono font-semibold text-lg">
                    {formatCurrency(parseFloat(trade.entryPrice))}
                  </p>
                </div>
                {trade.closePrice && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Close Price</p>
                    <p className="font-mono font-semibold text-lg">
                      {formatCurrency(parseFloat(trade.closePrice))}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* P&L and Margin */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">P&L</p>
                  {trade.pnl && (
                    <div className={getPnlColor(trade.pnl)}>
                      <p className="font-mono font-bold text-xl">
                        {parseFloat(trade.pnl) >= 0 ? '+' : ''}
                        {formatCurrency(parseFloat(trade.pnl))}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Margin</p>
                  <p className="font-mono font-semibold text-lg">
                    {formatCurrency(parseFloat(trade.margin))}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Notional</p>
                  <p className="font-mono font-semibold text-lg">
                    {formatCurrency(parseFloat(trade.notional))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Opened At</p>
                  <p className="font-semibold">
                    {new Date(trade.openAt).toLocaleString()}
                  </p>
                </div>
                {trade.closedAt && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Closed At</p>
                    <p className="font-semibold">
                      {new Date(trade.closedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Expiry At</p>
                  <p className="font-semibold">
                    {new Date(trade.expiryAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trade Statistics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Trade Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Notional Value</span>
                </div>
                <span className="font-mono font-semibold">
                  {formatCurrency(parseFloat(trade.notional))}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Leverage Used</span>
                </div>
                <span className="font-semibold">
                  {trade.leverage}x
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Margin</span>
                </div>
                <span className="font-mono font-semibold">
                  {formatCurrency(parseFloat(trade.margin))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {trade.pnl && (
                  <div className={`text-3xl font-bold ${getPnlColor(trade.pnl)}`}>
                    {parseFloat(trade.pnl) >= 0 ? '+' : ''}
                    {formatCurrency(parseFloat(trade.pnl))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Net Profit/Loss
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Margin Used:</span>
                  <span className="font-mono">
                    {formatCurrency(parseFloat(trade.margin))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Position Size:</span>
                  <span className="font-mono">
                    {parseFloat(trade.size).toFixed(6)} {trade.coin.symbol}
                  </span>
                </div>
                {trade.pnl && (
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Net P&L:</span>
                    <span className={`font-mono ${getPnlColor(trade.pnl)}`}>
                      {formatCurrency(parseFloat(trade.pnl))}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
