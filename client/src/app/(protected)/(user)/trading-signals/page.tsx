"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp,
  Signal as SignalIcon,
  Crown,
  DollarSign,
  Copy,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  Star,
  Zap,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/hooks/redux.hook";
import { api, PagedResponse } from "@/lib/api";
import { Signal, Subscription } from "@/types/signal";
import { Account } from "@/types/account";
import config from "@/lib/config";
import { TableLoading } from "@/components/Loading";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

type SignalPlan = keyof typeof config.signals;

export default function TradingSignalsPage() {
  const { user } = useAppSelector((state) => state.user);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SignalPlan | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0
  });

  // Fetch subscription status
  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoadingSubscription(true);
      const response = await api.get<Subscription | null>("/trading-signals/subscription");
      setSubscription(response.data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast.error("Failed to fetch subscription status");
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  // Fetch account balance
  const fetchAccount = useCallback(async () => {
    try {
      setIsLoadingAccount(true);
      const response = await api.get<Account>("/account");
      setAccount(response.data);
    } catch (error) {
      console.error("Error fetching account:", error);
      toast.error("Failed to fetch account balance");
    } finally {
      setIsLoadingAccount(false);
    }
  }, []);

  // Fetch trading signals
  const fetchSignals = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingSignals(true);
      const response = await api.get<PagedResponse<Signal>>("/trading-signals", {
        params: { page, limit: ITEMS_PER_PAGE }
      });
      
      setSignals(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total
      });
    } catch (error) {
      console.error("Error fetching signals:", error);
      toast.error("Failed to fetch trading signals");
    } finally {
      setIsLoadingSignals(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchAccount();
  }, [fetchSubscription, fetchAccount]);

  useEffect(() => {
    if (subscription?.isActive) {
      fetchSignals(1);
    }
  }, [subscription?.isActive, fetchSignals]);

  // Handle plan subscription
  const handleSubscribe = async (plan: SignalPlan) => {
    const planCost = config.signals[plan];
    
    if (!account) {
      toast.error("Unable to fetch account balance");
      return;
    }

    if (parseFloat(account.availableBalance) < planCost) {
      toast.error(`Insufficient balance. You need $${planCost} to subscribe to this plan.`);
      return;
    }

    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan) return;

    try {
      setIsSubscribing(true);
      await api.post("/trading-signals/subscribe", { plan: selectedPlan });
      
      toast.success(`Successfully subscribed to ${selectedPlan} plan!`);
      setShowConfirmDialog(false);
      setSelectedPlan(null);
      
      // Refresh subscription status and account balance
      fetchSubscription();
      fetchAccount();
    } catch (error) {
      console.error("Error subscribing:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message);
        } else {
          toast.error("Failed to subscribe. Please try again.");
        }
      } else {
        toast.error("Failed to subscribe. Please try again.");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  // Get plan display name
  const getPlanDisplayName = (plan: SignalPlan) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Get plan duration
  const getPlanDuration = (plan: SignalPlan) => {
    switch (plan) {
      case 'monthly':
        return '1 Month';
      case 'quarterly':
        return '3 Months';
      case 'yearly':
        return '12 Months';
      default:
        return '';
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (isLoadingSubscription) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading trading signals...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription plans if user doesn't have active subscription
  if (!subscription?.isActive) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Premium Trading Signals
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant access to accurate trading signals from our expert analysts. 
            Make informed decisions and maximize your trading profits.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="p-3 bg-info/10 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-info" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Signals</h3>
              <p className="text-sm text-muted-foreground">
                Receive instant notifications for trading opportunities
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="p-3 bg-success/10 rounded-full w-fit mx-auto mb-4">
                <Target className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">High Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                Professionally analyzed signals with proven track record
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Telegram Integration</h3>
              <p className="text-sm text-muted-foreground">
                Get signals directly in your Telegram for instant access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-8">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(Object.keys(config.signals) as SignalPlan[]).map((plan) => {
              const cost = config.signals[plan];
              const isPopular = plan === 'quarterly';
              
              return (
                <Card key={plan} className={`relative ${isPopular ? 'ring-2 ring-primary' : ''}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center space-x-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <span>{getPlanDisplayName(plan)}</span>
                    </CardTitle>
                    <CardDescription>{getPlanDuration(plan)}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{formatCurrency(cost)}</span>
                      <span className="text-muted-foreground">/{plan === 'yearly' ? 'year' : plan === 'quarterly' ? 'quarter' : 'month'}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">Real-time trading signals</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">Entry, TP, and SL levels</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">Telegram notifications</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">24/7 signal access</span>
                      </li>
                      {plan === 'yearly' && (
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium text-primary">Save 2 months free!</span>
                        </li>
                      )}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubscribe(plan)}
                      variant={isPopular ? "default" : "outline"}
                    >
                      Subscribe Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Account Balance */}
        {account && !isLoadingAccount && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">
                  {formatCurrency(account.availableBalance)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Available for subscription
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Subscription</DialogTitle>
              <DialogDescription>
                You are about to subscribe to the {selectedPlan && getPlanDisplayName(selectedPlan)} plan.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {selectedPlan && getPlanDisplayName(selectedPlan)} Plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan && getPlanDuration(selectedPlan)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {selectedPlan && formatCurrency(config.signals[selectedPlan])}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Will be deducted from balance
                  </p>
                </div>
              </div>
              
              {account && (
                <div className="mt-4 p-4 bg-info/10 border border-info/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-info" />
                    <span className="text-sm text-info-foreground">
                      Available Balance: {formatCurrency(account.availableBalance)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isSubscribing}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSubscription}
                disabled={isSubscribing}
              >
                {isSubscribing ? "Subscribing..." : "Confirm Subscription"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show signals page for active subscribers
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Trading Signals</h1>
        <p className="text-muted-foreground">
          Your premium trading signals and subscription details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscription Details & Telegram Setup */}
        <div className="space-y-6">
          {/* Active Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-primary" />
                <span>Active Subscription</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge variant="default">
                  {getPlanDisplayName(subscription.plan)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Started</span>
                <span className="text-sm font-medium">
                  {formatDate(subscription.startedAt)}
                </span>
              </div>
              
              {subscription.endedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm font-medium">
                    {formatDate(subscription.endedAt)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={subscription.isActive ? "default" : "destructive"}>
                  {subscription.isActive ? "Active" : "Expired"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Telegram Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-info" />
                <span>Telegram Setup</span>
              </CardTitle>
              <CardDescription>
                Connect your Telegram to receive signals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="telegramUserId">Telegram User ID</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="telegramUserId"
                    value={user?.telegramUserId || "Not set"}
                    readOnly
                    className="flex-1"
                  />
                  {user?.telegramUserId && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(user.telegramUserId!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.telegramUserId 
                    ? "You'll receive signals on this Telegram ID"
                    : "Please update your Telegram ID in profile settings"
                  }
                </p>
              </div>

              {!user?.telegramUserId && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm text-warning-foreground">
                      <p className="font-medium mb-1">Telegram Not Connected</p>
                      <p>Update your Telegram ID in profile settings to receive signal notifications.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trading Signals */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SignalIcon className="h-5 w-5" />
                <span>Recent Signals</span>
              </CardTitle>
              <CardDescription>
                Latest trading signals for your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSignals ? (
                <TableLoading rows={5} />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Currency</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entry</TableHead>
                        <TableHead>TP1</TableHead>
                        <TableHead>TP2</TableHead>
                        <TableHead>SL</TableHead>
                        <TableHead>Published</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="text-muted-foreground">
                              No signals available yet. New signals will appear here.
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        signals.map((signal) => (
                          <TableRow key={signal.id}>
                            <TableCell className="font-medium">
                              {signal.currency}
                            </TableCell>
                            <TableCell>                            <Badge 
                              variant={signal.action === 'Buy' ? 'default' : 'destructive'}
                              className={signal.action === 'Buy' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}
                            >
                              {signal.action}
                            </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              ${parseFloat(signal.entryPrice).toFixed(4)}
                            </TableCell>
                            <TableCell className="font-mono">
                              ${parseFloat(signal.tp1).toFixed(4)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {signal.tp2 ? `$${parseFloat(signal.tp2).toFixed(4)}` : '-'}
                            </TableCell>
                            <TableCell className="font-mono">
                              ${parseFloat(signal.sl).toFixed(4)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {signal.publishedAt ? formatDate(signal.publishedAt) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} signals
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSignals(pagination.page - 1)}
                          disabled={pagination.page <= 1 || isLoadingSignals}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          Page {pagination.page} of {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSignals(pagination.page + 1)}
                          disabled={pagination.page >= totalPages || isLoadingSignals}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
