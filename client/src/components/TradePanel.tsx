"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calculator, Clock, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import api from "@/lib/api";
import { Coin } from "@/types/asset";

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
  { label: "1 minute", value: 1 },
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
  { label: "8 hours", value: 480 },
  { label: "1 day", value: 1440 },
  { label: "3 days", value: 4320 },
  { label: "7 days", value: 10080 },
];

interface TradePanelProps {
  coin: Coin;
  currentPrice: string;
  onTradeComplete?: () => void;
}

export function TradePanel({ coin, currentPrice, onTradeComplete }: TradePanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const watchedValues = form.watch();
  
  // Calculate trade details
  const calculateTradeDetails = () => {
    const price = parseFloat(currentPrice.replace(/,/g, ''));
    const { margin, leverage } = watchedValues;
    const notional = margin * leverage;
    const quantity = notional / price;
    const liquidationPrice = watchedValues.side === "buy" 
      ? price * (1 - 0.8 / leverage) // 80% margin requirement for long
      : price * (1 + 0.8 / leverage); // 80% margin requirement for short

    return {
      notional: notional.toFixed(2),
      quantity: quantity.toFixed(6),
      liquidationPrice: liquidationPrice.toFixed(2),
      maintenanceMargin: (notional * 0.005).toFixed(2), // 0.5% maintenance margin
    };
  };

  const tradeDetails = calculateTradeDetails();

  const onSubmit = async (data: TradeFormData) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/positions', data);
      const position = response.data;

      // Reset form on success
      form.reset({
        coinId: coin.id,
        side: data.side,
        leverage: 1,
        margin: 100,
        durationMinutes: 60,
      });

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

  const handleBuySubmit = () => {
    form.setValue("side", "buy");
    form.handleSubmit(onSubmit)();
  };

  const handleSellSubmit = () => {
    form.setValue("side", "sell");
    form.handleSubmit(onSubmit)();
  };

  // Quick amount buttons
  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Place Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <div className="space-y-4">
            
            {/* Asset Display */}
            <div className="space-y-2">
              <Label>Trading Pair</Label>
              <div className="p-3 bg-muted rounded-md text-center">
                <div className="font-mono font-bold text-lg">{coin.symbol}/USDT</div>
                <div className="text-sm text-muted-foreground">
                  Current Price: <span className="font-mono">${currentPrice}</span>
                </div>
              </div>
            </div>

            {/* Margin Input with Quick Buttons */}
            <FormField
              control={form.control}
              name="margin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margin Amount (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="100.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {/* Quick amount buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => form.setValue("margin", amount)}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Leverage Selection */}
            <FormField
              control={form.control}
              name="leverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leverage</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leverage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEVERAGE_OPTIONS.map((leverage) => (
                        <SelectItem key={leverage} value={leverage.toString()}>
                          {leverage}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration Selection */}
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Position Duration
                  </FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trade Details Summary */}
            <div className="space-y-3 p-4 bg-muted rounded-md border">
              <h4 className="font-semibold text-sm">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notional Value:</span>
                  <span className="font-mono">${tradeDetails.notional}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-mono">{tradeDetails.quantity} {coin.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry Price:</span>
                  <span className="font-mono">${currentPrice}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Est. Liquidation:</span>
                  <span className="font-mono text-red-600">${tradeDetails.liquidationPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maintenance Margin:</span>
                  <span className="font-mono">${tradeDetails.maintenanceMargin}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buy Button */}
              <Button 
                type="button"
                onClick={handleBuySubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white text-lg py-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    BUY / LONG
                  </>
                )}
              </Button>
              
              {/* Sell Button */}
              <Button 
                type="button"
                onClick={handleSellSubmit}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white text-lg py-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <TrendingDown className="mr-2 h-4 w-4" />
                    SELL / SHORT
                  </>
                )}
              </Button>
            </div>
          </div>
        </Form>

        {/* Risk Warning */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
            <div className="font-semibold">⚠️ Risk Warning:</div>
            <div>
              • Trading with leverage magnifies both profits and losses<br/>
              • You may lose more than your initial margin<br/>
              • Positions are automatically closed at expiry or liquidation<br/>
              • Only trade with funds you can afford to lose
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}