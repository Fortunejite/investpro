"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Clock,
  Percent,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Zap,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { api, PagedResponse, handleAPIError } from "@/lib/api";
import config from "@/lib/config";
import { createInvestmentSchema } from "@/types/investments/investment.schema";
import { Investment, InvestmentPlan } from "@/types/investments";
import { Account } from "@/types/account";
import { TableLoading } from "@/components/Loading";
import { toast } from "sonner";
import type { z } from "zod";
import { formatCurrency, formatDate } from "@/lib/utils";

type CreateInvestmentData = z.infer<typeof createInvestmentSchema>;

const ITEMS_PER_PAGE = 10;

const InvestmentsPage = () => {
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(true);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0
  });

  const form = useForm<CreateInvestmentData>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: {
      planId: 0,
      amount: 0,
    },
  });

  // Fetch investment plans
  const fetchInvestmentPlans = useCallback(async () => {
    try {
      setIsLoadingPlans(true);
      const response = await api.get<{ data: InvestmentPlan[] }>("/investment-plans");
      setInvestmentPlans(response.data.data);
    } catch (error) {
      console.error("Error fetching investment plans:", error);
      toast.error("Failed to fetch investment plans");
    } finally {
      setIsLoadingPlans(false);
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

  // Fetch investment history
  const fetchInvestments = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingInvestments(true);
      const response = await api.get<PagedResponse<Investment>>("/investments", {
        params: { page, limit: ITEMS_PER_PAGE }
      });
      
      setInvestments(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total
      });
    } catch (error) {
      console.error("Error fetching investments:", error);
      toast.error("Failed to fetch investment history");
    } finally {
      setIsLoadingInvestments(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestmentPlans();
    fetchAccount();
    fetchInvestments(1);
  }, [fetchInvestmentPlans, fetchAccount, fetchInvestments]);

  // Handle invest button click
  const handleInvestClick = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    form.reset({
      planId: plan.id,
      amount: plan.minAmount,
    });
    setShowInvestDialog(true);
  };

  // Handle form submission
  const onSubmit = async (data: CreateInvestmentData) => {
    if (!selectedPlan || !account) return;

    // Check if amount meets minimum requirement
    if (data.amount < selectedPlan.minAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Minimum investment amount is $${selectedPlan.minAmount}`
      });
      return;
    }

    // Check if user has sufficient balance
    if (parseFloat(account.availableBalance) < data.amount) {
      form.setError("amount", {
        type: "manual",
        message: `Insufficient balance. Available: $${parseFloat(account.availableBalance).toFixed(2)}`
      });
      return;
    }

    setIsSubmitting(true);
    form.clearErrors();

    try {
      await api.post("/investments", data);
      
      toast.success(`Successfully invested $${data.amount} in ${selectedPlan.name}!`);
      setShowInvestDialog(false);
      setSelectedPlan(null);
      form.reset();
      
      // Refresh data
      fetchInvestments(1);
      fetchAccount();
      
    } catch (error: unknown) {
      handleAPIError<CreateInvestmentData>(error, form);
      
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message);
        } else {
          toast.error("Failed to create investment. Please try again.");
        }
      } else {
        toast.error("Failed to create investment. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: keyof typeof config.investmentStatuses) => {
    const statusStr = String(status);
    switch (statusStr) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'expired':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get payout type display
  const getPayoutTypeDisplay = (payoutType: keyof typeof config.payoutTypes) => {
    const payoutTypeStr = String(payoutType);
    return payoutTypeStr.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Investment Plans</h1>
        <p className="text-muted-foreground">
          Choose from our carefully curated investment plans and start growing your wealth today.
        </p>
      </div>

      {/* Account Balance */}
      {account && !isLoadingAccount && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(account.availableBalance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Locked Balance</p>
                <p className="text-lg font-semibold text-muted-foreground">
                  {formatCurrency(account.lockedBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Plans */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Available Investment Plans</h2>
        
        {isLoadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investmentPlans?.map((plan) => (
              <Card key={plan.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-10 translate-x-10"></div>
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{plan.name}</span>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {plan.roiPercent}% ROI
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {plan.description || "Professional investment plan with guaranteed returns"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Key Features */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Minimum Investment</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(plan.minAmount)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Duration</span>
                      </div>
                      <span className="font-semibold">{plan.durationInDays} days</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">ROI</span>
                      </div>
                      <span className="font-semibold text-success">{plan.roiPercent}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Payout</span>
                      </div>
                      <span className="font-semibold">{getPayoutTypeDisplay(plan.payoutType)}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="pt-4 border-t border-border">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">Guaranteed returns</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">Professional management</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">24/7 monitoring</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full mt-6" 
                    onClick={() => handleInvestClick(plan)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Invest Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {!isLoadingPlans && investmentPlans.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Investment Plans Available</h3>
              <p className="text-muted-foreground">
                Investment plans are currently being prepared. Please check back later.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Investment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Investment History</span>
          </CardTitle>
          <CardDescription>
            Track all your investment activities and returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvestments ? (
            <TableLoading rows={5} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No investments yet. Start by choosing an investment plan above!
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    investments.map((investment) => {
                      const plan = investmentPlans.find(p => p.id === investment.planId);
                      return (
                        <TableRow key={investment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {plan?.name || `Plan #${investment.planId}`}
                              </div>
                              {plan && (
                                <div className="text-xs text-muted-foreground">
                                  {plan.roiPercent}% ROI • {plan.durationInDays} days
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(investment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(investment.status)}>
                              {(investment.status as string).charAt(0).toUpperCase() + (investment.status as string).slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            <span className="text-success">
                              +{formatCurrency(investment.profit)}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(investment.startDate)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(investment.endDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} investments
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchInvestments(pagination.page - 1)}
                      disabled={pagination.page <= 1 || isLoadingInvestments}
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
                      onClick={() => fetchInvestments(pagination.page + 1)}
                      disabled={pagination.page >= totalPages || isLoadingInvestments}
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

      {/* Investment Dialog */}
      <Dialog open={showInvestDialog} onOpenChange={setShowInvestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest in {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Enter the amount you want to invest in this plan.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Plan Details */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">{selectedPlan.durationInDays} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ROI</span>
                    <span className="font-medium text-success">{selectedPlan.roiPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Minimum</span>
                    <span className="font-medium">{formatCurrency(selectedPlan.minAmount)}</span>
                  </div>
                </div>

                {/* Investment Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Amount (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min={selectedPlan.minAmount}
                            placeholder={selectedPlan.minAmount.toString()}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="pr-16"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                            {account && !isLoadingAccount && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => field.onChange(parseFloat(account.availableBalance))}
                              >
                                Max
                              </Button>
                            )}
                            <span className="text-muted-foreground text-sm">USD</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {account && !isLoadingAccount && (
                        <p className="text-xs text-muted-foreground">
                          Available Balance: {formatCurrency(account.availableBalance)}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Expected Returns */}
                {form.watch("amount") > 0 && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Expected Returns</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Investment:</span>
                        <span className="font-medium">{formatCurrency(form.watch("amount"))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Return:</span>
                        <span className="font-medium text-success">
                          {formatCurrency(form.watch("amount") * (1 + selectedPlan.roiPercent / 100))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit:</span>
                        <span className="font-medium text-success">
                          +{formatCurrency(form.watch("amount") * (selectedPlan.roiPercent / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {form.formState.errors.root && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {form.formState.errors.root.message}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInvestDialog(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || form.watch("amount") < selectedPlan.minAmount}
                  >
                    {isSubmitting ? "Processing..." : "Confirm Investment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvestmentsPage;