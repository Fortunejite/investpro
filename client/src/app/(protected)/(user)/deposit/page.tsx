"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { 
  Copy, 
  Upload, 
  Loader2, 
  Check, 
  QrCode, 
  ArrowDownToLine,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useAppSelector } from "@/hooks/redux.hook";
import { api, PagedResponse } from "@/lib/api";
import { uploadPhoto } from "@/lib/uploadPhoto";
import { createDepositSchema } from "@/types/deposit/deposit.schema";
import { Deposit } from "@/types/deposit";
import config from "@/lib/config";
import { TableLoading } from "@/components/Loading";
import { toast } from "sonner";
import type { z } from "zod";

import QRCode from "qrcode";
import { PriceResponse } from "@/types/price";
import { formatCurrency, formatDate } from "@/lib/utils";

type CreateDepositData = z.infer<typeof createDepositSchema>;

const ITEMS_PER_PAGE = 10;

export default function DepositPage() {
  const { settings } = useAppSelector((state) => state.settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [depositHistory, setDepositHistory] = useState<Deposit[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [filterChain, setFilterChain] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0
  });

  const form = useForm<CreateDepositData>({
    resolver: zodResolver(createDepositSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const watchAmount = form.watch("amount");

  // Chain address mapping
  const chainAddresses = useMemo(() => ({
    eth: settings?.ethAddress || "",
    bsc: settings?.bnbAddress || "",
    polygon: settings?.bnbAddress || "", // Assuming same as BSC for polygon
    sol: settings?.solAddress || "",
  }), [settings]);

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

  // Initialize first address and chain
  useEffect(() => {
    const chains = config.chains;
    if (chains.length > 0 && !selectedChain) {
      const firstChain = chains[0];
      setSelectedChain(firstChain);
      form.setValue("chain", firstChain);
      setSelectedAddress(chainAddresses[firstChain] || "");
    }
  }, [settings, selectedChain, form, chainAddresses]);

  // Generate QR code when address changes
  useEffect(() => {
    if (selectedAddress) {
      QRCode.toDataURL(selectedAddress, { width: 200, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error("QR code generation failed:", err));
    }
  }, [selectedAddress]);

  // Fetch deposit history
  const fetchDepositHistory = useCallback(async (page: number = 1, chain?: string, status?: string) => {
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
      
      const response = await api.get<PagedResponse<Deposit>>("/deposits", { params });
      
      setDepositHistory(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total
      });
    } catch (error) {
      console.error("Error fetching deposit history:", error);
      toast.error("Failed to fetch deposit history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchDepositHistory(1, filterChain, filterStatus);
  }, [fetchDepositHistory, filterChain, filterStatus]);

  // Handle chain selection
  const handleChainChange = (chain: string) => {
    setSelectedChain(chain);
    form.setValue("chain", chain as "eth" | "bsc" | "sol");
    setSelectedAddress(chainAddresses[chain as keyof typeof chainAddresses] || "");
  };

  // Copy address to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(selectedAddress);
      setCopySuccess(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
      toast.error("Failed to copy address");
    }
  };

  // Handle file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProofFile(file);
  };

  // Calculate USD equivalent
  const usdEquivalent = currentPrice * (watchAmount || 0);

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

  // Handle form submission
  const onSubmit = async (data: CreateDepositData) => {
    setIsSubmitting(true);
    form.clearErrors();

    try {
      let proofUrl = "";
      
      // Upload proof if provided
      if (proofFile) {
        const uploadResult = await uploadPhoto(proofFile);
        if (uploadResult.success) {
          proofUrl = uploadResult.url;
        } else {
          form.setError("root", {
            type: "manual",
            message: uploadResult.error || "Failed to upload proof"
          });
          return;
        }
      }

      const submitData = {
        ...data,
        ...(proofUrl && { proofUrl })
      };

      await api.post("/deposits", submitData);
      
      // Reset form and refresh history
      form.reset();
      setProofFile(null);
      fetchDepositHistory(1, filterChain, filterStatus);
      
      // Show success message
      toast.success("Deposit request submitted successfully!");
      
    } catch (error: unknown) {
      // Handle API errors
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string; issues?: Array<{ path: string; message: string }>; message?: string } } };
        
        if (axiosError.response?.data?.error === "ValidationError" && axiosError.response?.data?.issues) {
          axiosError.response.data.issues.forEach((issue: { path: string; message: string }) => {
            form.setError(issue.path as keyof CreateDepositData, {
              type: "server",
              message: issue.message,
            });
          });
        } else if (axiosError.response?.data?.message) {
          form.setError("root", {
            type: "server",
            message: axiosError.response.data.message,
          });
          toast.error(axiosError.response.data.message);
        } else {
          form.setError("root", {
            type: "server",
            message: "Something went wrong. Please try again.",
          });
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        form.setError("root", {
          type: "server", 
          message: "Something went wrong. Please try again.",
        });
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Make a Deposit</h1>
        <p className="text-muted-foreground">
          Fund your account to start investing in various opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deposit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowDownToLine className="h-5 w-5" />
                <span>New Deposit</span>
              </CardTitle>
              <CardDescription>
                Select your preferred cryptocurrency and enter the deposit amount.
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

                  {/* Amount Input */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Amount ({selectedChain ? config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.symbol : ""})
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              step="0.00000001"
                              min="0"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="pr-20"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                              {selectedChain ? config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.symbol : ""}
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
                                  1 {config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.symbol} ≈ ${currentPrice.toLocaleString()}
                                </div>
                                {usdEquivalent > 0 && (
                                  <div className="font-medium text-foreground">
                                    You&apos;ll receive ≈ ${usdEquivalent.toLocaleString()} USD
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Transaction Hash */}
                  <FormField
                    control={form.control}
                    name="txHash"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Hash (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter transaction hash if available"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Proof of Payment Upload */}
                  <div className="space-y-2">
                    <Label>Proof of Payment (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="proof-upload"
                      />
                      <label
                        htmlFor="proof-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <span className="text-primary font-medium">Click to upload</span>
                          <span className="text-muted-foreground"> or drag and drop</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          PNG, JPG, GIF up to 10MB
                        </span>
                      </label>
                      {proofFile && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">{proofFile.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Display */}
                  {form.formState.errors.root && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedAddress}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Deposit...
                      </>
                    ) : (
                      "Submit Deposit Request"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Deposit Address & QR Code */}
        <div className="space-y-6">
          {selectedAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deposit Address</CardTitle>
                <CardDescription>
                  Send your {selectedChain ? config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.name : ""} to this address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      <Image
                        src={qrCodeUrl}
                        alt="Deposit Address QR Code"
                        width={200}
                        height={200}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Address with Copy Button */}
                <div className="space-y-2">
                  <Label>Wallet Address</Label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                      {selectedAddress}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="shrink-0"
                    >
                      {copySuccess ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* QR Code Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <QrCode className="mr-2 h-4 w-4" />
                      View QR Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Deposit Address QR Code</DialogTitle>
                      <DialogDescription>
                        Scan this QR code with your wallet to send {config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-4">
                      {qrCodeUrl && (
                        <div className="p-4 bg-white rounded-lg">
                          <Image
                            src={qrCodeUrl}
                            alt="Deposit Address QR Code"
                            width={250}
                            height={250}
                            className="rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Warning */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Important:</p>
                      <p>Only send {config.chainInfo[selectedChain as keyof typeof config.chainInfo]?.name} to this address. Sending other cryptocurrencies may result in permanent loss.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Deposit History */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Deposit History</CardTitle>
            <CardDescription>Track all your deposit transactions</CardDescription>
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
                    <TableHead>Amount</TableHead>
                    <TableHead>USD Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depositHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No deposits yet. Make your first deposit above!
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    depositHistory.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(deposit.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {config.chainInfo[deposit.chain].symbol}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {config.chainInfo[deposit.chain].name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {deposit.amount} {config.chainInfo[deposit.chain].symbol}
                        </TableCell>
                        <TableCell>
                          {formatCurrency((parseFloat(deposit.amount) * parseFloat(deposit.perUsdRate)).toString())}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(deposit.status)}>
                            {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
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
                    {pagination.total} deposits
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchDepositHistory(pagination.page - 1, filterChain, filterStatus)}
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
                      onClick={() => fetchDepositHistory(pagination.page + 1, filterChain, filterStatus)}
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