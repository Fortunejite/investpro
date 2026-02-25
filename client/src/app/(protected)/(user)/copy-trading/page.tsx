"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Target,
  Trophy,
  Users,
  Copy,
  UserX,
  Eye,
  Filter,
  SortAsc,
  BarChart3,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { TraderFollower, TradingProfile } from "@/types/user";
import { AxiosError } from "@/types/api";

type SortOption = "profit" | "winRate" | "trades" | "followers" | "newest";
type FilterOption = "all" | "high-profit" | "high-winrate" | "experienced";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtPct = (v: string | number) => `${Number(v).toFixed(2)}%`;

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function winRateColor(rate: number) {
  if (rate >= 80)
    return {
      ring: "text-success",
      bg: "bg-success/10",
      text: "text-success",
      label: "Excellent",
    };
  if (rate >= 70)
    return {
      ring: "text-primary",
      bg: "bg-primary/10",
      text: "text-primary",
      label: "Good",
    };
  if (rate >= 60)
    return {
      ring: "text-warning",
      bg: "bg-warning/10",
      text: "text-warning",
      label: "Average",
    };
  return {
    ring: "text-destructive",
    bg: "bg-destructive/10",
    text: "text-destructive",
    label: "Poor",
  };
}

// ─── Win-rate ring ─────────────────────────────────────────────────────────────
function WinRateRing({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.max(0, rate));
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const col = winRateColor(pct);
  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="4"
          className="stroke-muted"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="4"
          className={col.ring}
          style={{
            stroke: "currentColor",
            strokeDasharray: circ,
            strokeDashoffset: circ - dash,
            strokeLinecap: "round",
          }}
        />
      </svg>
      <span className={`text-xs font-bold ${col.text}`}>{pct.toFixed(0)}%</span>
    </div>
  );
}

// ─── Card skeleton ────────────────────────────────────────────────────────────
function TraderSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-14 w-14 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ─── Trader card ──────────────────────────────────────────────────────────────
interface TraderCardProps {
  trader: TradingProfile;
  isCopied: boolean;
  onCopy: (id: number) => void;
  onStop: (id: number) => void;
  onView: (t: TradingProfile) => void;
}

function TraderCard({ trader, isCopied, onCopy, onStop, onView }: TraderCardProps) {
  const rate = Number(trader.winRate);
  const col = winRateColor(rate);
  const initials = getInitials(trader.user?.name ?? "?");

  // avatar color from name hash
  const colors = [
    "bg-primary",
    "bg-success",
    "bg-warning",
    "bg-info",
    "bg-destructive",
  ];
  const colorIdx =
    (trader.user?.name ?? "")
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;

  return (
    <Card className="group overflow-hidden border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div
              className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 ${colors[colorIdx]}`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground truncate">
                  {trader.user?.name ?? "Unknown Trader"}
                </span>
                {isCopied && (
                  <Badge
                    variant="outline"
                    className="text-success border-success/40 bg-success/5 text-[10px] py-0 px-1.5 gap-0.5"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Copying
                  </Badge>
                )}
              </div>
              <span className={`text-xs font-medium ${col.text}`}>
                {col.label}
              </span>
            </div>
          </div>
          {/* Win rate ring */}
          <WinRateRing rate={rate} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 py-2.5 px-2">
            <div className="text-sm font-bold text-success">
              {formatCurrency(trader.totalProfit)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Profit
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 py-2.5 px-2">
            <div className="text-sm font-bold">{trader.totalTrades}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Trades
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 py-2.5 px-2">
            <div className="text-sm font-bold text-primary">
              {fmtPct(trader.profitSharePercent)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Share
            </div>
          </div>
        </div>

        {/* Bio */}
        {trader.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {trader.bio}
          </p>
        )}

        {/* Min capital */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
          <span>Min. Capital</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(trader.minCapital)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isCopied ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  <UserX className="h-3.5 w-3.5 mr-1.5" />
                  Stop Copying
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stop Copying {trader.user?.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will no longer replicate their trades automatically.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onStop(trader.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Stop Copying
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button size="sm" className="flex-1" onClick={() => onCopy(trader.id)}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy Trader
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5 hover:bg-accent"
            onClick={() => onView(trader)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const CopyTradingPage = () => {
  const [traders, setTraders] = useState<TradingProfile[]>([]);
  const [copiedTraders, setCopiedTraders] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("profit");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [selectedTrader, setSelectedTrader] = useState<TradingProfile | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchTraders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/traders");
      setTraders(res.data || []);
    } catch {
      toast.error("Failed to load traders");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCopiedTraders = useCallback(async () => {
    try {
      const res = await api.get("/traders/copied");
      setCopiedTraders(res.data.map((f: TraderFollower) => f.traderId));
    } catch {
      /* silent */
    }
  }, []);

  const handleCopyTrader = async (traderId: number) => {
    try {
      await api.post(`/traders/${traderId}/copy`);
      toast.success("Started copying trader");
      setCopiedTraders((p) => [...p, traderId]);
    } catch (err) {
      toast.error(
        (err as AxiosError).response?.data?.message || "Failed to copy trader"
      );
    }
  };

  const handleStopCopying = async (traderId: number) => {
    try {
      await api.delete(`/traders/${traderId}/copy`);
      toast.success("Stopped copying trader");
      setCopiedTraders((p) => p.filter((id) => id !== traderId));
    } catch (err) {
      toast.error(
        (err as AxiosError).response?.data?.message || "Failed to stop copying"
      );
    }
  };

  const handleSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        fetchTraders();
        return;
      }
      try {
        setSearching(true);
        const res = await api.get(`/traders?search=${encodeURIComponent(q)}`);
        setTraders(res.data || []);
      } catch {
        toast.error("Search failed");
      } finally {
        setSearching(false);
      }
    },
    [fetchTraders]
  );

  const filteredTraders = useCallback(() => {
    let list = [...traders];
    if (filterBy === "high-profit")
      list = list.filter((t) => Number(t.totalProfit) > 1000);
    if (filterBy === "high-winrate")
      list = list.filter((t) => Number(t.winRate) > 70);
    if (filterBy === "experienced") list = list.filter((t) => t.totalTrades > 50);
    if (searchQuery.trim())
      list = list.filter(
        (t) =>
          t.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    list.sort((a, b) => {
      if (sortBy === "profit")
        return Number(b.totalProfit) - Number(a.totalProfit);
      if (sortBy === "winRate") return Number(b.winRate) - Number(a.winRate);
      if (sortBy === "trades") return b.totalTrades - a.totalTrades;
      if (sortBy === "newest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return 0;
    });
    return list;
  }, [traders, filterBy, searchQuery, sortBy])();

  useEffect(() => {
    fetchTraders();
    fetchCopiedTraders();
  }, [fetchTraders, fetchCopiedTraders]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
      else fetchTraders();
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, handleSearch, fetchTraders]);

  // summary stats
  const totalProfit = traders.reduce((a, t) => a + Number(t.totalProfit), 0);
  const avgWinRate = traders.length
    ? traders.reduce((a, t) => a + Number(t.winRate), 0) / traders.length
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Copy className="h-7 w-7 text-primary" />
            Copy Trading
          </h1>
          <p className="text-muted-foreground mt-1">
            Mirror top traders automatically and grow your portfolio with ease.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTraders}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Summary banner ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Available Traders",
            value: traders.length.toString(),
            icon: Users,
            color: "text-primary",
          },
          {
            label: "You're Copying",
            value: copiedTraders.length.toString(),
            icon: CheckCircle2,
            color: "text-success",
          },
          {
            label: "Avg Win Rate",
            value: `${avgWinRate.toFixed(1)}%`,
            icon: Target,
            color: "text-warning",
          },
          {
            label: "Total Platform Profit",
            value: formatCurrency(totalProfit),
            icon: TrendingUp,
            color: "text-success",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/60 ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {s.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or bio…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searching && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Select
              value={filterBy}
              onValueChange={(v: FilterOption) => setFilterBy(v)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Traders</SelectItem>
                <SelectItem value="high-profit">High Profit ($1k+)</SelectItem>
                <SelectItem value="high-winrate">High Win Rate (70%+)</SelectItem>
                <SelectItem value="experienced">Experienced (50+ trades)</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v: SortOption) => setSortBy(v)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SortAsc className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Highest Profit</SelectItem>
                <SelectItem value="winRate">Best Win Rate</SelectItem>
                <SelectItem value="trades">Most Trades</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <TraderSkeleton key={i} />)
          : filteredTraders.map((trader) => (
              <TraderCard
                key={trader.id}
                trader={trader}
                isCopied={copiedTraders.includes(trader.id)}
                onCopy={handleCopyTrader}
                onStop={handleStopCopying}
                onView={(t) => {
                  setSelectedTrader(t);
                  setIsDetailsOpen(true);
                }}
              />
            ))}
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && filteredTraders.length === 0 && (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No traders found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || filterBy !== "all"
                  ? "Try adjusting your search or filters"
                  : "No traders are available at the moment"}
              </p>
            </div>
            {(searchQuery || filterBy !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Trader detail dialog ─────────────────────────────────────────── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {selectedTrader?.user?.name ?? "Trader"} — Profile
            </DialogTitle>
          </DialogHeader>
          {selectedTrader &&
            (() => {
              const rate = Number(selectedTrader.winRate);
              const col = winRateColor(rate);
              const colorIdx =
                (selectedTrader.user?.name ?? "")
                  .split("")
                  .reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
              const colors = [
                "bg-primary",
                "bg-success",
                "bg-warning",
                "bg-info",
                "bg-destructive",
              ];
              return (
                <div className="space-y-5 mt-1">
                  {/* Identity */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                    <div
                      className={`h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0 ${colors[colorIdx]}`}
                    >
                      {getInitials(selectedTrader.user?.name ?? "?")}
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {selectedTrader.user?.name}
                      </div>
                      <span className={`text-sm font-medium ${col.text}`}>
                        {col.label} Trader
                      </span>
                    </div>
                    <WinRateRing rate={rate} />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      {
                        icon: DollarSign,
                        value: formatCurrency(selectedTrader.totalProfit),
                        label: "Total Profit",
                        color: "text-success",
                      },
                      {
                        icon: Trophy,
                        value: selectedTrader.totalTrades.toString(),
                        label: "Total Trades",
                        color: "text-primary",
                      },
                      {
                        icon: Target,
                        value: `${selectedTrader.successfulTrades}`,
                        label: "Successful",
                        color: "text-success",
                      },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div
                          key={s.label}
                          className="rounded-xl bg-muted/40 border border-border/40 py-4"
                        >
                          <Icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                          <div className={`text-lg font-bold ${s.color}`}>
                            {s.value}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {s.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detail rows */}
                  <div className="space-y-2 rounded-xl border border-border/40 overflow-hidden divide-y divide-border/40">
                    {[
                      {
                        label: "Profit Share",
                        value: fmtPct(selectedTrader.profitSharePercent),
                        icon: Zap,
                      },
                      {
                        label: "Minimum Capital",
                        value: formatCurrency(selectedTrader.minCapital),
                        icon: DollarSign,
                      },
                    ].map((r) => {
                      const Icon = r.icon;
                      return (
                        <div
                          key={r.label}
                          className="flex items-center justify-between px-4 py-2.5 bg-background/50"
                        >
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon className="h-3.5 w-3.5" />
                            {r.label}
                          </div>
                          <span className="text-sm font-semibold">{r.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bio */}
                  {selectedTrader.bio && (
                    <div className="rounded-xl bg-muted/30 border border-border/40 p-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedTrader.bio}
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex gap-2 pt-1">
                    {copiedTraders.includes(selectedTrader.id) ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5">
                            <UserX className="h-4 w-4 mr-2" />
                            Stop Copying
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Stop Copying {selectedTrader.user?.name}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              You will no longer receive their trading signals.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                handleStopCopying(selectedTrader.id);
                                setIsDetailsOpen(false);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Stop Copying
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        className="flex-1"
                        onClick={() => {
                          handleCopyTrader(selectedTrader.id);
                          setIsDetailsOpen(false);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy This Trader
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CopyTradingPage;
