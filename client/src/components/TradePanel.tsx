"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Clock, Loader2, Zap, AlertTriangle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import api from "@/lib/api";
import { Coin } from "@/types/asset";
import { cn } from "@/lib/utils";

// Define the trade form schema based on the backend controller
const tradeFormSchema = z.object({
  coinId: z.string(),
  side: z.enum(['buy', 'sell']),
  margin: z.number().min(10, "Minimum margin is $10"),
  leverage: z.number().min(1, "Minimum leverage is 1x").max(100, "Maximum leverage is 100x"),
  durationMinutes: z.number().min(1, "Minimum duration is 1 minute").max(7 * 24 * 60, "Maximum duration is 7 days"),
});

type TradeFormData = z.infer<typeof tradeFormSchema>;

// Constants
const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];
const DURATION_OPTIONS = [
  { label: "1 min",   value: 1 },
  { label: "5 min",   value: 5 },
  { label: "15 min",  value: 15 },
  { label: "30 min",  value: 30 },
  { label: "1 hour",  value: 60 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
  { label: "8 hours", value: 480 },
  { label: "1 day",   value: 1440 },
  { label: "3 days",  value: 4320 },
  { label: "7 days",  value: 10080 },
];
const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

interface TradePanelProps {
  coin: Coin;
  currentPrice: string;
  onTradeComplete?: () => void;
}

export function TradePanel({ coin, currentPrice, onTradeComplete }: TradePanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSide, setActiveSide] = useState<"buy" | "sell">("buy");

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      coinId: coin.id,
      side: "buy",
      leverage: 1,
      margin: 100,
      durationMinutes: 60, // 1 hour default
    },
  });

  // Update coinId when coin changes
  useEffect(() => {
    form.setValue("coinId", coin.id);
  }, [coin.id, form]);

  const { margin, leverage } = form.watch();
  const price = parseFloat(currentPrice.replace(/,/g, "")) || 0;
  const notional = (margin || 0) * (leverage || 1);
  const quantity = price > 0 ? notional / price : 0;
  const liqPrice =
    activeSide === "buy"
      ? price * (1 - 0.8 / (leverage || 1))
      : price * (1 + 0.8 / (leverage || 1));

  const onSubmit = async (data: TradeFormData) => {
    setIsSubmitting(true);
    try {
      await api.post('/positions', data);
      form.reset({ coinId: coin.id, side: activeSide, leverage: 1, margin: 100, durationMinutes: 60 });
      toast.success(`${data.side.toUpperCase()} order placed successfully!`);

      // Notify parent component if callback provided
      onTradeComplete?.();
      
    } catch (error) {
      console.error("Trade submission error:", error);
      toast.error("Failed to place order", {
        description: "Please check your inputs and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (side: "buy" | "sell") => {
    setActiveSide(side);
    form.setValue("side", side);
    form.handleSubmit(onSubmit)();
  };

  const isBuy = activeSide === "buy";

  return (
    <Card className="w-full border-border/60 overflow-hidden">
      {/* ── Buy / Sell tab header ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 border-b border-border/40">
        <button
          type="button"
          onClick={() => setActiveSide("buy")}
          className={cn(
            "flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all duration-200",
            activeSide === "buy"
              ? "bg-success/10 text-success border-b-2 border-success"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <TrendingUp className="h-4 w-4" />
          Buy / Long
        </button>
        <button
          type="button"
          onClick={() => setActiveSide("sell")}
          className={cn(
            "flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all duration-200",
            activeSide === "sell"
              ? "bg-destructive/10 text-destructive border-b-2 border-destructive"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <TrendingDown className="h-4 w-4" />
          Sell / Short
        </button>
      </div>

      <CardContent className="p-5 space-y-5">
        <Form {...form}>
          {/* ── Price display ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/40 px-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Trading Pair</div>
              <div className="font-bold font-mono text-base mt-0.5">{coin.symbol.toUpperCase()}/USDT</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Market Price</div>
              <div className="font-bold font-mono text-base mt-0.5">${currentPrice}</div>
            </div>
          </div>

          {/* ── Margin ──────────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="margin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Margin (USD)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                    <Input
                      type="number"
                      step="1"
                      placeholder="100"
                      className="pl-7 font-mono"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                {/* Quick amounts */}
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => form.setValue("margin", amt)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150",
                        field.value === amt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Leverage ────────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="leverage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Leverage
                </FormLabel>
                <div className="flex gap-1.5 flex-wrap">
                  {LEVERAGE_OPTIONS.map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => field.onChange(lev)}
                      style={
                        field.value === lev
                          ? {
                              backgroundColor: isBuy ? "var(--success)" : "var(--destructive)",
                              color: isBuy ? "var(--success-foreground)" : "var(--destructive-foreground, #fff)",
                              borderColor: isBuy ? "var(--success)" : "var(--destructive)",
                            }
                          : {}
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-bold border transition-all duration-150",
                        field.value === lev
                          ? ""
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      {lev}×
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Duration ────────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Duration
                </FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="font-mono text-sm">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DURATION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value.toString()} className="font-mono text-sm">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Order summary ───────────────────────────────────────────── */}
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/40">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide">Order Summary</span>
            </div>
            <div className="divide-y divide-border/30">
              {/*
                { label: "Notional Value", value: `$${notional.toFixed(2)}` },
                { label: "Quantity", value: `${quantity.toFixed(6)} ${coin.symbol.toUpperCase()}` },
                { label: "Entry Price", value: `$${currentPrice}` },
                { label: "Maintenance Margin", value: `$${(notional * 0.005).toFixed(2)}` },
              */}
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-xs text-muted-foreground">Notional Value</span>
                <span className="text-xs font-mono font-semibold">${notional.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-xs text-muted-foreground">Quantity</span>
                <span className="text-xs font-mono font-semibold">{quantity.toFixed(6)} {coin.symbol.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-xs text-muted-foreground">Entry Price</span>
                <span className="text-xs font-mono font-semibold">${currentPrice}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-destructive/5">
                <span className="text-xs text-muted-foreground">Est. Liquidation</span>
                <span className="text-xs font-mono font-semibold text-destructive">
                  ${liqPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ── CTA buttons ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              onClick={() => handleSubmit("buy")}
              disabled={isSubmitting}
              style={{
                backgroundColor: "var(--success)",
                color: "var(--success-foreground)",
              }}
              className="h-12 text-sm font-bold gap-2 border-0 hover:opacity-90 transition-opacity"
            >
              {isSubmitting && activeSide === "buy" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</>
              ) : (
                <><TrendingUp className="h-4 w-4" /> BUY / LONG</>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit("sell")}
              disabled={isSubmitting}
              style={{
                backgroundColor: "var(--destructive)",
                color: "var(--destructive-foreground, #fff)",
              }}
              className="h-12 text-sm font-bold gap-2 border-0 hover:opacity-90 transition-opacity"
            >
              {isSubmitting && activeSide === "sell" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</>
              ) : (
                <><TrendingDown className="h-4 w-4" /> SELL / SHORT</>
              )}
            </Button>
          </div>
        </Form>

        {/* ── Risk warning ──────────────────────────────────────────────── */}
        <div className="flex gap-3 rounded-lg bg-warning/5 border border-warning/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-warning">Risk Warning:</span> Leverage trading magnifies both
            profits and losses. Positions close automatically at expiry or liquidation. Only trade with funds
            you can afford to lose.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}