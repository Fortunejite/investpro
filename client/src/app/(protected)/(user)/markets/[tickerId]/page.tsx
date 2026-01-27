"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  DollarSign,
  BarChart3,
  Clock,
  Globe,
  RefreshCw
} from "lucide-react";
import { Ticker } from "@/types/ticker";
import Loading from "@/components/Loading";
import api, { isAxiosError } from "@/lib/api";

const TickerDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const tickerId = params.tickerId as string;

  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const getTicker = async () => {
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
  };

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
  }, [tickerId]);

  if (loading) {
    return <Loading />;
  }

  if (error || !ticker) {
    return (
      <div className="container mx-auto p-6">
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
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Button>
        
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Ticker Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                {!imageError ? (
                  <Image
                    src={ticker.img}
                    alt={ticker.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                    onError={handleImageError}
                  />
                ) : (
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold">{ticker.name}</h1>
                  <Badge variant="secondary" className="text-sm">
                    {ticker.symbol.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Rank #{ticker.rank}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Last updated: Just now</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-bold font-mono mb-2">
                {formatCurrency(ticker.price_usd)}
              </div>
              <div className={`text-lg font-medium ${getPercentageColor(ticker.percent_change_24h)}`}>
                <div className="flex items-center justify-end gap-2">
                  {parseFloat(ticker.percent_change_24h) >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {formatPercentage(ticker.percent_change_24h)} (24h)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Changes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">1 Hour Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPercentageColor(ticker.percent_change_1h)}`}>
              <div className="flex items-center gap-2">
                {parseFloat(ticker.percent_change_1h) >= 0 ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
                {formatPercentage(ticker.percent_change_1h)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">24 Hour Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPercentageColor(ticker.percent_change_24h)}`}>
              <div className="flex items-center gap-2">
                {parseFloat(ticker.percent_change_24h) >= 0 ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
                {formatPercentage(ticker.percent_change_24h)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">7 Day Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPercentageColor(ticker.percent_change_7d)}`}>
              <div className="flex items-center gap-2">
                {parseFloat(ticker.percent_change_7d) >= 0 ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
                {formatPercentage(ticker.percent_change_7d)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
              <div className="text-xl font-semibold font-mono">
                {formatCurrency(ticker.market_cap_usd)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
              <div className="text-xl font-semibold font-mono">
                {formatCurrency(ticker.volume24)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Circulating Supply</div>
              <div className="text-xl font-semibold font-mono">
                {formatNumber(ticker.csupply)} {ticker.symbol.toUpperCase()}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Supply</div>
              <div className="text-xl font-semibold font-mono">
                {ticker.tsupply ? formatNumber(ticker.tsupply) : 'N/A'} {ticker.symbol.toUpperCase()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Price Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-mono font-semibold">{formatCurrency(ticker.price_usd)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Market Cap Rank</span>
              <Badge variant="outline">#{ticker.rank}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Price Change (24h)</span>
              <span className={`font-mono font-semibold ${getPercentageColor(ticker.percent_change_24h)}`}>
                {formatPercentage(ticker.percent_change_24h)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Supply Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Circulating Supply</span>
              <span className="font-mono font-semibold">
                {formatNumber(ticker.csupply)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Supply</span>
              <span className="font-mono font-semibold">
                {ticker.tsupply ? formatNumber(ticker.tsupply) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
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
