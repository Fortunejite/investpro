'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Image from 'next/image';
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
import { Filter, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import api, { PagedResponse, handleAPIError } from '@/lib/api';
import { Account } from '@/types/account';
import { User } from '@/types/user';
import config from '@/lib/config';
import { rejectDepositSchema } from '@/types/deposit/deposit.schema';

interface DepositWithAccount {
  id: string;
  accountId: number;
  chain: string;
  perUsdRate: string;
  amount: string;
  txHash?: string;
  proofUrl?: string;
  status: string;
  adminNote?: string;
  createdAt: Date;
  account: Account & { user: User };
}

interface DepositFilters {
  status: string;
  chain: string;
  userId: string;
}

const AdminDepositsPage = () => {
  const [deposits, setDeposits] = useState<DepositWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<DepositFilters>({
    status: 'all',
    chain: 'all',
    userId: '',
  });

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedDeposit, setSelectedDeposit] =
    useState<DepositWithAccount | null>(null);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  const rejectForm = useForm<z.infer<typeof rejectDepositSchema>>({
    resolver: zodResolver(rejectDepositSchema),
    defaultValues: {
      adminNote: '',
    },
  });

  const fetchDeposits = useCallback(
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

        const response = await api.get<PagedResponse<DepositWithAccount>>(
          `/deposits/admin?${params}`,
        );
        setDeposits(response.data.data);
        setPagination((prev) => ({
          ...prev,
          page,
          total: response.data.pagination.total,
        }));
      } catch (error) {
        console.error('Error fetching deposits:', error);
        toast.error('Failed to fetch deposits');
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit],
  );

  const handleApprove = async (depositId: string) => {
    try {
      setActionLoading(depositId);
      await api.post(`/deposits/${depositId}/approve`);
      toast.success('Deposit approved successfully');
      fetchDeposits(pagination.page);
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast.error('Failed to approve deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (values: z.infer<typeof rejectDepositSchema>) => {
    if (!selectedDeposit) return;

    try {
      setActionLoading(selectedDeposit.id);
      await api.post(`/deposits/${selectedDeposit.id}/reject`, values);
      toast.success('Deposit rejected successfully');
      setShowRejectDialog(false);
      setSelectedDeposit(null);
      rejectForm.reset();
      fetchDeposits(pagination.page);
    } catch (error) {
      handleAPIError(error, {
        setError: (name, error) =>
          rejectForm.setError(name as 'adminNote' | 'root', error),
      });
      toast.error('Failed to reject deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (key: keyof DepositFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/90 text-warning-foreground border-warning/90';
      case 'approved':
        return 'bg-success/90 hover:bg-success text-success-foreground';
      case 'rejected':
        return 'bg-destructive/90 text-destructive-foreground border-destructive/30';
      case 'cancelled':
        return 'bg-muted/90 text-muted-foreground border-muted-foreground/30';
      default:
        return 'bg-muted/90 text-muted-foreground border-muted-foreground/30';
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

  useEffect(() => {
    fetchDeposits(1);
  }, [fetchDeposits]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Deposits Management
        </h1>
        <p className="text-muted-foreground">
          Review and manage user deposit requests
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
                      {config.chainInfo[chain].name}
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
            <Button onClick={() => fetchDeposits(1)} variant="outline">
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

      {/* Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Deposits</CardTitle>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No deposits found
                        </TableCell>
                      </TableRow>
                    ) : (
                      deposits.map((deposit) => {
                        const amounts = formatAmount(
                          deposit.amount,
                          deposit.perUsdRate,
                        );
                        return (
                          <TableRow key={deposit.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {deposit.account.user?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {deposit.account.user?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {config.chainInfo[
                                  deposit.chain as keyof typeof config.chainInfo
                                ]?.name || deposit.chain.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {amounts.crypto} {deposit.chain.toUpperCase()}
                            </TableCell>
                            <TableCell className="font-mono">
                              ${amounts.usd}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(deposit.status)}
                              >
                                {deposit.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {deposit.txHash ? (
                                <span className="font-mono text-sm truncate max-w-25">
                                  {deposit.txHash}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(deposit.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {deposit.proofUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setProofUrl(deposit.proofUrl!);
                                      setShowProofDialog(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                {deposit.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleApprove(deposit.id)}
                                      disabled={actionLoading === deposit.id}
                                      className="bg-success/90 hover:bg-success text-success-foreground"
                                    >
                                      {actionLoading === deposit.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedDeposit(deposit);
                                        setShowRejectDialog(true);
                                      }}
                                      disabled={actionLoading === deposit.id}
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
                    of {pagination.total} deposits
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchDeposits(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchDeposits(pagination.page + 1)}
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
            <DialogTitle>Reject Deposit</DialogTitle>
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
                        placeholder="Please provide a reason for rejecting this deposit..."
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
                    setSelectedDeposit(null);
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
                  Reject Deposit
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Deposit Proof</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
            {proofUrl ? (
              <Image
                src={proofUrl}
                alt="Deposit Proof"
                width={800}
                height={600}
                className="max-w-full max-h-96 object-contain rounded"
                onError={() => {
                  toast.error('Failed to load proof image');
                }}
              />
            ) : (
              <p className="text-muted-foreground">No proof available</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowProofDialog(false);
                setProofUrl('');
              }}
            >
              Close
            </Button>
            {proofUrl && (
              <Button
                type="button"
                onClick={() => window.open(proofUrl, '_blank')}
              >
                Open in New Tab
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDepositsPage;
