'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Filter, CheckCircle, XCircle, Loader2, Clipboard } from 'lucide-react';
import api, { PagedResponse, handleAPIError } from '@/lib/api';
import { Account } from '@/types/account';
import { User } from '@/types/user';
import config from '@/lib/config';
import { formatDate } from '@/lib/utils';

const rejectWithdrawalSchema = z.object({
  adminNote: z.string().min(1, 'Please provide a reason for rejection'),
});

interface WithdrawalWithAccount {
  id: string;
  accountId: number;
  chain: string;
  perUsdRate: string;
  amount: string;
  destinationAddress: string;
  status: string;
  adminNote?: string;
  createdAt: Date;
  account: Account & { user: User };
}

interface WithdrawalFilters {
  status: string;
  chain: string;
  userId: string;
}

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<WithdrawalFilters>({
    status: 'all',
    chain: 'all',
    userId: '',
  });

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalWithAccount | null>(null);

  const rejectForm = useForm<z.infer<typeof rejectWithdrawalSchema>>({
    resolver: zodResolver(rejectWithdrawalSchema),
    defaultValues: {
      adminNote: '',
    },
  });

  const fetchWithdrawals = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        if (filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters.chain !== 'all') {
          params.append('chain', filters.chain);
        }
        if (filters.userId) {
          params.append('userId', filters.userId);
        }

        const response = await api.get<PagedResponse<WithdrawalWithAccount>>(
          `/withdrawals/admin?${params}`,
        );
        setWithdrawals(response.data.data);
        setPagination((prev) => ({
          ...prev,
          page,
          total: response.data.pagination.total,
        }));
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
        toast.error('Failed to fetch withdrawals');
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit],
  );

  const handleApprove = async (withdrawalId: string) => {
    try {
      setActionLoading(withdrawalId);
      await api.post(`/withdrawals/${withdrawalId}/approve`);
      toast.success('Withdrawal approved successfully');
      fetchWithdrawals(pagination.page);
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Failed to approve withdrawal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (values: z.infer<typeof rejectWithdrawalSchema>) => {
    if (!selectedWithdrawal) return;

    try {
      setActionLoading(selectedWithdrawal.id);
      await api.post(`/withdrawals/${selectedWithdrawal.id}/reject`, values);
      toast.success('Withdrawal rejected successfully');
      setShowRejectDialog(false);
      setSelectedWithdrawal(null);
      rejectForm.reset();
      fetchWithdrawals(pagination.page);
    } catch (error) {
      handleAPIError(error, {
        setError: (name, error) =>
          rejectForm.setError(name as 'adminNote' | 'root', error),
      });
      toast.error('Failed to reject withdrawal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (key: keyof WithdrawalFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning-foreground border-warning/30';
      case 'approved':
        return 'bg-success/20 text-success-foreground border-success/30';
      case 'rejected':
        return 'bg-destructive/20 text-destructive-foreground border-destructive/30';
      case 'cancelled':
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
      default:
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
    }
  };

  const formatAmount = (amount: string, perUsdRate: string) => {
    const amountNum = parseFloat(amount);
    const rateNum = parseFloat(perUsdRate);
    const usdValue = amountNum * rateNum;
    return {
      crypto: amountNum.toFixed(6),
      usd: usdValue.toFixed(2),
    };
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    fetchWithdrawals(1);
  }, [fetchWithdrawals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Withdrawals Management
        </h1>
        <p className="text-muted-foreground">
          Review and manage user withdrawal requests
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {config.transactionStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chain</label>
              <Select
                value={filters.chain}
                onValueChange={(value) => handleFilterChange('chain', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  {config.chains.map((chain) => (
                    <SelectItem key={chain} value={chain}>
                      {config.chainInfo[chain]?.name || chain.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Filter by User ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => fetchWithdrawals(1)} variant="outline">
              Apply Filters
            </Button>
            <Button
              onClick={() =>
                setFilters({ status: 'all', chain: 'all', userId: '' })
              }
              variant="ghost"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Chain</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>USD Value</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No withdrawals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      withdrawals.map((withdrawal) => {
                        const amounts = formatAmount(
                          withdrawal.amount,
                          withdrawal.perUsdRate,
                        );
                        return (
                          <TableRow key={withdrawal.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {withdrawal.account.user?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {withdrawal.account.user?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {config.chainInfo[
                                  withdrawal.chain as keyof typeof config.chainInfo
                                ]?.name || withdrawal.chain.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {amounts.crypto} {withdrawal.chain.toUpperCase()}
                            </TableCell>
                            <TableCell className="font-mono">
                              ${amounts.usd}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">
                                  {shortenAddress(withdrawal.destinationAddress)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(withdrawal.destinationAddress);
                                    toast.success('Address copied to clipboard');
                                  }}
                                >
                                  <Clipboard className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(withdrawal.status)}
                              >
                                {withdrawal.status}
                              </Badge>
                              {withdrawal.adminNote && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Note: {withdrawal.adminNote}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(withdrawal.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {withdrawal.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleApprove(withdrawal.id)}
                                      disabled={actionLoading === withdrawal.id}
                                      className="bg-success/90 hover:bg-success text-success-foreground"
                                    >
                                      {actionLoading === withdrawal.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedWithdrawal(withdrawal);
                                        setShowRejectDialog(true);
                                      }}
                                      disabled={actionLoading === withdrawal.id}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing{' '}
                    {Math.min(
                      (pagination.page - 1) * pagination.limit + 1,
                      pagination.total,
                    )}{' '}
                    to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{' '}
                    of {pagination.total} withdrawals
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchWithdrawals(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchWithdrawals(pagination.page + 1)}
                      disabled={
                        pagination.page * pagination.limit >=
                          pagination.total || loading
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
          </DialogHeader>
          <Form {...rejectForm}>
            <form
              onSubmit={rejectForm.handleSubmit(handleReject)}
              className="space-y-4"
            >
              <FormField
                control={rejectForm.control}
                name="adminNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Rejection</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Please provide a reason for rejecting this withdrawal..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setSelectedWithdrawal(null);
                    rejectForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={actionLoading !== null}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject Withdrawal
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawalsPage;
