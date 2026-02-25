"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  BarChart3,
  Globe,
  RefreshCw,
  LineChart,
  Activity,
  Layers,
  Coins,
} from "lucide-react";
import { Ticker } from "@/types/ticker";
import api, { isAxiosError } from "@/lib/api";
import AdvancedTradingChart from "@/components/AdvancedTradingChart";
import SimpleTradingChart from "@/components/SimpleTradingChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Asset } from "@/types/asset";
import { TradePanel } from "@/components/TradePanel";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (v: string | number, digits = 2) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "$0.00";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(digits)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(digits)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(digits)}K`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
};

const fmtNum = (v: string | number) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
};

const fmtPct = (v: string) => {
  const n = parseFloat(v);
  if (isNaN(n)) return "0.00%";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
};

const pctColor = (v: string) => {
  const n = parseFloat(v);
  return n >= 0 ? "text-success" : "text-destructive";
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-4">
          <Skeleton className="h-[500px] rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="xl:col-span-4 space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── StatRow ─────────────────────────────────────────────────────────────────
function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold font-mono">{value}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
const TickerDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const tickerId = params.tickerId as string;

  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState<"simple" | "advanced">("simple");
  const [timeframe, setTimeframe] = useState("1h");
  const [userAsset, setUserAsset] = useState<Asset | null>(null);

  const getTicker = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get(`/market/coins/${tickerId}`);
      setTicker(res.data);
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message ?? "Failed to fetch ticker data"
          : err instanceof Error
          ? err.message
          : "Failed to fetch ticker data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tickerId]);

  const getUserAsset = useCallback(async () => {
    try {
      const res = await api.get(`/assets/${tickerId}`);
      setUserAsset(res.data);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status !== 404)
        console.error("Error fetching user asset:", err);
      setUserAsset(null);
    }
  }, [tickerId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getTicker(), getUserAsset()]);
  };

  useEffect(() => {
    if (tickerId) {
      setLoading(true);
      getTicker();
      getUserAsset();
    }
  }, [tickerId, getTicker, getUserAsset]);

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) return <PageSkeleton />;

  // ── error ────────────────────────────────────────────────────────────────
  if (error || !ticker) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-10 flex flex-col items-center gap-4 text-center">
            <TrendingDown className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">{error || "Cryptocurrency not found"}</h2>
            <p className="text-muted-foreground">We couldn&apos;t load data for this asset.</p>
            <Button onClick={getTicker} variant="outline">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const priceUp = parseFloat(ticker.percent_change_24h) >= 0;

  return (
    <div className="space-y-5">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Markets
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Coin identity + balance hero ─────────────────────────────────── */}
      <Card className="border-border/60 bg-gradient-to-r from-primary/5 via-background to-background overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Left: Identity */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                {ticker.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ticker.img} alt={ticker.name} className="h-9 w-9 object-contain" />
                ) : (
                  <Coins className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{ticker.name}</h1>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {ticker.symbol.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">#{ticker.rank}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-bold font-mono">{fmt(ticker.price_usd)}</span>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${pctColor(ticker.percent_change_24h)}`}>
                    {priceUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {fmtPct(ticker.percent_change_24h)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: user balance */}
            <div className="shrink-0 sm:text-right rounded-xl bg-background/60 border border-border/40 px-5 py-3">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Your Balance</div>
              <div className="text-xl font-bold font-mono">
                {userAsset ? parseFloat(userAsset.availableBalance).toFixed(6) : "0.000000"}
                <span className="text-sm text-muted-foreground ml-1.5">{ticker.symbol.toUpperCase()}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                ≈ {fmt(userAsset ? parseFloat(userAsset.availableBalance) * parseFloat(ticker.price_usd) : 0)} USD
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* Left col */}
        <div className="xl:col-span-8 space-y-5">

          {/* Chart card */}
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="border-b border-border/40 py-3 px-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Price Chart
                </CardTitle>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Timeframe pills */}
                  <div className="flex items-center gap-1">
                    {['1m','5m','15m','1h','4h','1d','1w'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          timeframe === tf
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  {/* Chart type toggle */}
                  <Tabs value={chartType} onValueChange={(v) => setChartType(v as "simple" | "advanced")}>
                    <TabsList className="h-8 p-0.5 bg-muted/60">
                      <TabsTrigger value="simple" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <LineChart className="h-3.5 w-3.5" />
                        Simple
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Advanced
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs value={chartType} onValueChange={(v) => setChartType(v as "simple" | "advanced")}>
                <TabsContent value="simple" className="mt-0">
                  <SimpleTradingChart
                    coin={ticker}
                    exchange="BINANCE"
                    timeframe={timeframe}
                    height={480}
                  />
                </TabsContent>
                <TabsContent value="advanced" className="mt-0">
                  <div className="h-[480px] w-full">
                    <AdvancedTradingChart
                      asset={ticker.symbol.toUpperCase()}
                      exchange="binance"
                      timeframe={timeframe}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trade panel */}
          <TradePanel
            coin={ticker}
            currentPrice={ticker.price_usd}
            onTradeComplete={getUserAsset}
          />
        </div>

        {/* Right col */}
        <div className="xl:col-span-4 space-y-5">

          {/* 24h changes */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-primary" />
                Price Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatRow
                label="1h Change"
                value={
                  <span className={pctColor(ticker.percent_change_1h)}>
                    {fmtPct(ticker.percent_change_1h)}
                  </span>
                }
              />
              <StatRow
                label="24h Change"
                value={
                  <span className={pctColor(ticker.percent_change_24h)}>
                    {fmtPct(ticker.percent_change_24h)}
                  </span>
                }
              />
              <StatRow
                label="7d Change"
                value={
                  <span className={pctColor(ticker.percent_change_7d)}>
                    {fmtPct(ticker.percent_change_7d)}
                  </span>
                }
              />
            </CardContent>
          </Card>

          {/* Market stats */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-primary" />
                Market Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatRow label="Market Cap" value={fmt(ticker.market_cap_usd)} />
              <StatRow label="24h Volume" value={fmt(ticker.volume24)} />
              <StatRow label="Rank" value={`#${ticker.rank}`} />
            </CardContent>
          </Card>

          {/* Supply */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-primary" />
                Supply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatRow label="Circulating" value={fmtNum(ticker.csupply)} />
              <StatRow label="Total" value={ticker.tsupply ? fmtNum(ticker.tsupply) : "—"} />
              <StatRow label="Max" value={ticker.msupply ? fmtNum(ticker.msupply) : "∞"} />
              {ticker.tsupply && ticker.msupply && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Circulating %</span>
                    <span>{((parseFloat(ticker.csupply) / parseFloat(ticker.msupply)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, (parseFloat(ticker.csupply) / parseFloat(ticker.msupply)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-primary" />
                Links
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <a
                href={`https://coinmarketcap.com/currencies/${ticker.nameId}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent transition-colors">CoinMarketCap ↗</Badge>
              </a>
              <a
                href={`https://www.coingecko.com/en/coins/${ticker.nameId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent transition-colors">CoinGecko ↗</Badge>
              </a>
              <a
                href={`https://www.tradingview.com/symbols/${ticker.symbol.toUpperCase()}USDT/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent transition-colors">TradingView ↗</Badge>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TickerDetailsPage;
