"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowUpFromLine,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
// import { useAppSelector } from "@/hooks/redux.hook"; // Available for future use
import { api, PagedResponse, handleAPIError } from "@/lib/api";
import { createWithdrawalSchema } from "@/types/withdrawal/withdrawal.schema";
import { Withdrawal } from "@/types/withdrawal";
import { Account } from "@/types/account";
import config from "@/lib/config";
import { TableLoading } from "@/components/Loading";
import { toast } from "sonner";
import type { z } from "zod";
import { PriceResponse } from "@/types/price";
import { formatCurrency, formatDate } from "@/lib/utils";

type CreateWithdrawalData = z.infer<typeof createWithdrawalSchema>;

const ITEMS_PER_PAGE = 10;

export default function WithdrawalPage() {
  // const { user } = useAppSelector((state) => state.user); // Available for future use
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string>("");
  const [withdrawalHistory, setWithdrawalHistory] = useState<Withdrawal[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [filterChain, setFilterChain] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0
  });

  const form = useForm<CreateWithdrawalData>({
    resolver: zodResolver(createWithdrawalSchema),
    defaultValues: {
      amount: 0,
      destinationAddress: "",
    },
  });

  const watchAmount = form.watch("amount");

  // Debounced price fetching
  const fetchPrice = useCallback(async (chain: string) => {
    if (!chain) return;
    
    setIsPriceLoading(true);
    setPriceError("");
    
    try {
      const response = await api.get<PriceResponse>(`/prices/${chain}`);
      setCurrentPrice(response.data.usd);
    } catch (error) {
      console.error("Error fetching price:", error);
      setPriceError("Failed to fetch current price");
      setCurrentPrice(0);
    } finally {
      setIsPriceLoading(false);
    }
  }, []);

  // Debounce effect for price fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedChain) {
        fetchPrice(selectedChain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedChain, fetchPrice]);

  // Initialize first chain
  useEffect(() => {
    const chains = config.chains;
    if (chains.length > 0 && !selectedChain) {
      const firstChain = chains[0];
      setSelectedChain(firstChain);
      form.setValue("chain", firstChain);
    }
  }, [selectedChain, form]);

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

  // Fetch withdrawal history
  const fetchWithdrawalHistory = useCallback(async (page: number = 1, chain?: string, status?: string) => {
    try {
      setIsLoadingHistory(true);
      const params: Record<string, string | number> = { 
        page, 
        limit: ITEMS_PER_PAGE 
      };
      
      // Add filters if they're not "all"
      if (chain && chain !== "all") {
        params.chain = chain;
      }
      if (status && status !== "all") {
        params.status = status;
      }
      
      const response = await api.get<PagedResponse<Withdrawal>>("/withdrawals", { params });
      
      setWithdrawalHistory(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total
      });
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      toast.error("Failed to fetch withdrawal history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawalHistory(1, filterChain, filterStatus);
  }, [fetchWithdrawalHistory, filterChain, filterStatus]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  // Handle chain selection
  const handleChainChange = (chain: string) => {
    setSelectedChain(chain);
    form.setValue("chain", chain as "eth" | "bsc" | "sol");
  };

  // Calculate crypto equivalent (USD to crypto)
  const cryptoEquivalent = currentPrice > 0 ? (watchAmount || 0) / currentPrice : 0;

  // Filter handlers
  const handleChainFilter = (chain: string) => {
    setFilterChain(chain);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilterChain("all");
    setFilterStatus("all");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle withdrawal cancellation
  const handleCancelWithdrawal = async (withdrawalId: string) => {
    try {
      await api.post(`/withdrawals/${withdrawalId}/cancel`);
      
      // Refresh history and account balance
      fetchWithdrawalHistory(pagination.page, filterChain, filterStatus);
      fetchAccount();
      
      toast.success("Withdrawal cancelled successfully!");
    } catch (error: unknown) {
      console.error("Error cancelling withdrawal:", error);
      
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message);
        } else {
          toast.error("Failed to cancel withdrawal. Please try again.");
        }
      } else {
        toast.error("Failed to cancel withdrawal. Please try again.");
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: CreateWithdrawalData) => {
    // Check if withdrawal amount exceeds available balance
    if (account && parseFloat(account.availableBalance) < data.amount) {
      form.setError("amount", {
        type: "manual",
        message: `Insufficient balance. Available: ${formatCurrency(account.availableBalance)}`
      });
      return;
    }

    setIsSubmitting(true);
    form.clearErrors();

    try {
      await api.post("/withdrawals", data);
      
      // Reset form and refresh history and account
      form.reset();
      fetchWithdrawalHistory(1, filterChain, filterStatus);
      fetchAccount();
      
      // Show success message
      toast.success("Withdrawal request submitted successfully!");
      
    } catch (error: unknown) {
      // Use the reusable handleAPIError utility
      handleAPIError<CreateWithdrawalData>(error, form);
      
      // Also show toast for better user feedback
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message);
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Make a Withdrawal</h1>
        <p className="text-muted-foreground">
          Withdraw your funds to your preferred cryptocurrency wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowUpFromLine className="h-5 w-5" />
                <span>New Withdrawal</span>
              </CardTitle>
              <CardDescription>
                Select your preferred cryptocurrency and enter the withdrawal details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Chain Selection */}
                  <FormField
                    control={form.control}
                    name="chain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Cryptocurrency</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleChainChange(value);
                        }} value={selectedChain}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose cryptocurrency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {config.chains.map((chain) => (
                              <SelectItem key={chain} value={chain}>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {config.chainInfo[chain].name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    ({config.chainInfo[chain].symbol})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Destination Address */}
                  <FormField
                    control={form.control}
                    name="destinationAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder={`Enter your ${selectedChain ? config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.name : ""} wallet address`}
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Make sure this address supports {selectedChain ? config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.name : ""} network
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Amount Input (USD) */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Amount (USD)</FormLabel>
                          {account && !isLoadingAccount && (
                            <span className="text-xs text-muted-foreground">
                              Available: {formatCurrency(account.availableBalance)}
                            </span>
                          )}
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="pr-20"
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
                        
                        {/* Price Information */}
                        {selectedChain && (
                          <div className="space-y-2 text-sm">
                            {isPriceLoading ? (
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Fetching current price...</span>
                              </div>
                            ) : priceError ? (
                              <div className="flex items-center space-x-2 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <span>{priceError}</span>
                              </div>
                            ) : currentPrice > 0 ? (
                              <div className="space-y-1">
                                <div className="text-muted-foreground">
                                  1 USD ≈ {(1 / currentPrice).toFixed(8)} {config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.symbol}
                                </div>
                                {cryptoEquivalent > 0 && (
                                  <div className="font-medium text-foreground">
                                    You&apos;ll receive ≈ {cryptoEquivalent.toFixed(8)} {config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.symbol}
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Error Display */}
                  {form.formState.errors.root && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedChain}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Withdrawal...
                      </>
                    ) : (
                      "Submit Withdrawal Request"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Withdrawal Information</CardTitle>
              <CardDescription>
                Important details about your withdrawal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Available Balance */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                {isLoadingAccount ? (
                  <div className="h-8 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">
                    {account ? formatCurrency(account.availableBalance) : "$0.00"}
                  </div>
                )}
                {account && !isLoadingAccount && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Locked: {formatCurrency(account.lockedBalance)}
                  </div>
                )}
              </div>

              {/* Processing Time */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Processing Time</Label>
                <p className="text-sm text-muted-foreground">
                  Withdrawals are typically processed within 24-48 hours after approval.
                </p>
              </div>

              {/* Minimum Withdrawal */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Minimum Withdrawal</Label>
                <p className="text-sm text-muted-foreground">
                  $50.00 USD minimum withdrawal amount
                </p>
              </div>

              {/* Network Fees */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Network Fees</Label>
                <p className="text-sm text-muted-foreground">
                  Network fees will be deducted from your withdrawal amount
                </p>
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Important:</p>
                    <p>Double-check your wallet address. Withdrawals to incorrect addresses cannot be recovered.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Withdrawal History */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Withdrawal History</CardTitle>
            <CardDescription>Track all your withdrawal transactions</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        
        {/* Filter Section */}
        {showFilters && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Label htmlFor="chain-filter" className="text-sm font-medium">Chain:</Label>
                <Select value={filterChain} onValueChange={handleChainFilter}>
                  <SelectTrigger className="w-35" id="chain-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chains</SelectItem>
                    {config.chains.map((chain) => (
                      <SelectItem key={chain} value={chain}>
                        {config.chainInfo[chain].symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter" className="text-sm font-medium">Status:</Label>
                <Select value={filterStatus} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-35" id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(filterChain !== "all" || filterStatus !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        <CardContent>
          {isLoadingHistory ? (
            <TableLoading rows={5} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Cryptocurrency</TableHead>
                    <TableHead>Amount (USD)</TableHead>
                    <TableHead>Crypto Amount</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawalHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No withdrawals yet. Make your first withdrawal above!
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    withdrawalHistory.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(withdrawal.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {config.chainInfo[withdrawal.chain].symbol}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {config.chainInfo[withdrawal.chain].name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {(parseFloat(withdrawal.amount) / parseFloat(withdrawal.perUsdRate)).toFixed(8)} {config.chainInfo[withdrawal.chain].symbol}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {withdrawal.destinationAddress 
                            ? `${withdrawal.destinationAddress.slice(0, 8)}...${withdrawal.destinationAddress.slice(-6)}`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(withdrawal.status)}>
                            {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {withdrawal.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleCancelWithdrawal(withdrawal.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
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
                    {pagination.total} withdrawals
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchWithdrawalHistory(pagination.page - 1, filterChain, filterStatus)}
                      disabled={pagination.page <= 1 || isLoadingHistory}
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
                      onClick={() => fetchWithdrawalHistory(pagination.page + 1, filterChain, filterStatus)}
                      disabled={pagination.page >= totalPages || isLoadingHistory}
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
  );
}
