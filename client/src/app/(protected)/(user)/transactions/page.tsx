"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { api, PagedResponse } from "@/lib/api";
import { Transaction } from "@/types/transaction";
import { TableLoading } from "@/components/Loading";
import { toast } from "sonner";
import { AxiosError } from "@/types/api";

const ITEMS_PER_PAGE = 20;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0
  });

  // Fetch transactions
  const fetchTransactions = useCallback(async (page: number = 1, type?: string, status?: string) => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = { 
        page, 
        limit: ITEMS_PER_PAGE 
      };
      
      // Add filters if they're not "all"
      if (type && type !== "all") {
        params.type = type;
      }
      if (status && status !== "all") {
        params.status = status;
      }
      
      const response = await api.get<PagedResponse<Transaction>>("/transactions", { params });
      
      setTransactions(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total
      });
    } catch (error) {
      const errorMessage = (error as AxiosError).response?.data?.message;
      console.error("Error fetching transactions:", error);
      toast.error(errorMessage || "Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(1, filterType, filterStatus);
  }, [fetchTransactions, filterType, filterStatus]);

  // Filter handlers
  const handleTypeFilter = (type: string) => {
    setFilterType(type);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Get transaction icon
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownToLine className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpFromLine className="h-4 w-4 text-red-500" />;
      case 'investment':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'profit_payout':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Get transaction type display name
  const getTypeDisplayName = (type: string) => {
    return type.replace('_', ' ').toLowerCase();
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">All Transactions</h1>
        <p className="text-muted-foreground">
          Complete history of your investment transactions and activities.
        </p>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {pagination.total > 0 ? `${pagination.total} total transactions` : "No transactions found"}
            </CardDescription>
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
                <Label htmlFor="type-filter" className="text-sm font-medium">Type:</Label>
                <Select value={filterType} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-40" id="type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="profit_payout">Profit Payout</SelectItem>
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(filterType !== "all" || filterStatus !== "all") && (
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
          {isLoading ? (
            <TableLoading rows={10} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {filterType !== "all" || filterStatus !== "all" 
                            ? "No transactions match your filters." 
                            : "No transactions yet. Start by making your first deposit!"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <div className="font-medium capitalize">
                                {getTypeDisplayName(transaction.type)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(transaction.createdAt)}
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
                    {pagination.total} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchTransactions(pagination.page - 1, filterType, filterStatus)}
                      disabled={pagination.page <= 1 || isLoading}
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
                      onClick={() => fetchTransactions(pagination.page + 1, filterType, filterStatus)}
                      disabled={pagination.page >= totalPages || isLoading}
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
