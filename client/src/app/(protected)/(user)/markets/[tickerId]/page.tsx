"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  BarChart3,
  Globe,
  RefreshCw,
  LineChart,
  Activity,
  ArrowLeftRight
} from "lucide-react";
import { Ticker } from "@/types/ticker";
import Loading from "@/components/Loading";
import api, { isAxiosError } from "@/lib/api";
import AdvancedTradingChart from "@/components/AdvancedTradingChart";
import SimpleTradingChart from "@/components/SimpleTradingChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

const TickerDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const tickerId = params.tickerId as string;

  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState<'simple' | 'advanced'>('simple');
  const [timeframe, setTimeframe] = useState('1h');

  const getTicker = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/market/coins/${tickerId}`);
      setTicker(response.data);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to fetch ticker data");
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch ticker data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tickerId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await getTicker();
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "$0.00";
    
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else if (num >= 1) {
      return `$${num.toFixed(2)}`;
    } else {
      return `$${num.toFixed(6)}`;
    }
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00%";
    return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const getPercentageColor = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "text-muted-foreground";
    return num >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  const formatNumber = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toLocaleString();
    }
  };

  useEffect(() => {
    if (tickerId) {
      getTicker();
    }
  }, [tickerId, getTicker]);

  if (loading) {
    return <Loading />;
  }

  if (error || !ticker) {
    return (
      <div>
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Button>
        </div>
        
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <TrendingDown className="h-12 w-12 text-destructive" />
              <div>
                <h2 className="text-xl font-semibold text-destructive mb-2">
                  {error || "Cryptocurrency not found"}
                </h2>
                <p className="text-muted-foreground mb-4">
                  We couldn&apos;t load the details for this cryptocurrency.
                </p>
                <Button onClick={getTicker} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Button>
        
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center gap-2 hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column - Chart and Trading Actions */}
        <div className="xl:col-span-8 space-y-6">
          {/* Chart Section with Switcher */}
          <Card className="shadow-sm border-border/40">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Price Chart
                </CardTitle>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Timeframe Selector */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="timeframe" className="text-sm font-medium">Timeframe:</Label>
                    <select
                      id="timeframe"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="px-3 py-1.5 border border-border rounded-md bg-background text-sm hover:border-border/80 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="1m">1m</option>
                      <option value="5m">5m</option>
                      <option value="15m">15m</option>
                      <option value="30m">30m</option>
                      <option value="1h">1h</option>
                      <option value="4h">4h</option>
                      <option value="1d">1d</option>
                      <option value="1w">1w</option>
                    </select>
                  </div>

                  {/* Chart Type Switcher */}
                  <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'simple' | 'advanced')}>
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                      <TabsTrigger value="simple" className="flex items-center gap-1 data-[state=active]:bg-background">
                        <LineChart className="h-4 w-4" />
                        <span className="hidden sm:inline">Simple</span>
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="flex items-center gap-1 data-[state=active]:bg-background">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Advanced</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="w-full h-125">
                <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'simple' | 'advanced')}>
                  <TabsContent value="simple" className="mt-0 w-full h-full">
                    {ticker && (
                      <div className="w-full h-full rounded-lg overflow-hidden border border-border/20">
                        <SimpleTradingChart 
                          coin={ticker} 
                          exchange="BINANCE" 
                          timeframe={timeframe}
                        />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="mt-0 w-full h-full">
                    {ticker && (
                      <div className="w-full h-full rounded-lg overflow-hidden border border-border/20">
                        <AdvancedTradingChart 
                          asset={ticker.symbol.toUpperCase()} 
                          exchange="binance" 
                          timeframe={timeframe}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Quick Trading Actions */}
          <Card className="shadow-sm border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                  onClick={() => router.push(`/trade?symbol=${ticker.symbol.toUpperCase()}USDT`)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Buy {ticker.symbol.toUpperCase()}
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 shadow-sm transition-all duration-200 hover:shadow-md"
                  onClick={() => router.push(`/swap?from=USDT&to=${ticker.symbol.toUpperCase()}`)}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Swap to {ticker.symbol.toUpperCase()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Market Statistics */}
        <div className="xl:col-span-4 space-y-6">
          {/* Market Statistics */}
          <Card className="shadow-sm border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Market Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
                  <div className="text-lg font-semibold font-mono">
                    {formatCurrency(ticker.market_cap_usd)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
                  <div className="text-lg font-semibold font-mono">
                    {formatCurrency(ticker.volume24)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Circulating Supply</div>
                  <div className="text-lg font-semibold font-mono">
                    {formatNumber(ticker.csupply)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Supply</div>
                  <div className="text-lg font-semibold font-mono">
                    {ticker.tsupply ? formatNumber(ticker.tsupply) : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Additional Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/40">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Price Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-mono font-semibold">{formatCurrency(ticker.price_usd)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground">Market Cap Rank</span>
              <Badge variant="outline" className="font-medium">#{ticker.rank}</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Price Change (24h)</span>
              <span className={`font-mono font-semibold ${getPercentageColor(ticker.percent_change_24h)}`}>
                {formatPercentage(ticker.percent_change_24h)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/40">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Supply Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground">Circulating Supply</span>
              <span className="font-mono font-semibold">
                {formatNumber(ticker.csupply)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground">Total Supply</span>
              <span className="font-mono font-semibold">
                {ticker.tsupply ? formatNumber(ticker.tsupply) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Max Supply</span>
              <span className="font-mono font-semibold">
                {ticker.msupply ? formatNumber(ticker.msupply) : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TickerDetailsPage;
