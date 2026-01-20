'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pause, TrendingUp, Users, DollarSign, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import api, { PagedResponse } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { User } from '@/types/user';

interface InvestmentPlan {
  id: number;
  name: string;
  roiPercent: number;
  durationInDays: number;
  payoutType: string;
}

interface Account {
  id: number;
  user: User;
}

interface Investment {
  id: string;
  accountId: number;
  planId: number;
  amount: string;
  profit: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  createdAt: Date;
  account: Account;
  plan: InvestmentPlan;
}

interface InvestmentFilters {
  status: string;
  userId: string;
  search: string;
}

const AdminInvestmentsPage = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Filter states
  const [filters, setFilters] = useState<InvestmentFilters>({
    status: 'all',
    userId: '',
    search: '',
  });

  // Dialog states
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [endingInvestment, setEndingInvestment] = useState<Investment | null>(null);

  // Fetch investments
  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.userId && { userId: filters.userId }),
      });

      const response = await api.get<PagedResponse<Investment>>(`/investments/admin?${params}`);
      setInvestments(response.data.data);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch {
      toast.error('Failed to fetch investments');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // End investment
  const handleEndInvestment = async () => {
    if (!endingInvestment) return;
    
    try {
      await api.post(`/investments/${endingInvestment.id}/end`);
      toast.success('Investment ended successfully');
      setEndDialogOpen(false);
      setEndingInvestment(null);
      fetchInvestments();
    } catch {
      toast.error('Failed to end investment');
    }
  };

  // Open end dialog
  const openEndDialog = (investment: Investment) => {
    setEndingInvestment(investment);
    setEndDialogOpen(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success bg-success/10';
      case 'inactive': return 'text-muted-foreground bg-muted';
      case 'expired': return 'text-warning bg-warning/10';
      case 'cancelled': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  // Calculate progress
  const calculateProgress = (investment: Investment) => {
    const now = new Date();
    const start = new Date(investment.startDate);
    const end = new Date(investment.endDate);
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Filter investments locally by search
  const filteredInvestments = investments.filter(investment => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      investment.account.user.name.toLowerCase().includes(search) ||
      investment.account.user.email.toLowerCase().includes(search) ||
      investment.plan.name.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // Calculate stats
  const stats = {
    totalInvestments: investments.length,
    activeInvestments: investments.filter(i => i.status === 'active').length,
    totalAmount: investments.reduce((acc, i) => acc + parseFloat(i.amount), 0),
    totalProfit: investments.reduce((acc, i) => acc + parseFloat(i.profit), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investments</h1>
          <p className="text-muted-foreground">Monitor all user investments and returns</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvestments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeInvestments} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(investments.filter(i => i.status === 'active').map(i => i.accountId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with active investments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              All time investments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Generated profits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Filter Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by name, email, or plan..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                placeholder="Filter by user ID..."
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={() => setFilters({ status: 'all', userId: '', search: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Investment History ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvestments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{investment.account.user.name}</p>
                          <p className="text-sm text-muted-foreground">{investment.account.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{investment.plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {investment.plan.roiPercent}% ROI • {investment.plan.durationInDays}d
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(investment.amount)}
                      </TableCell>
                      <TableCell className="font-semibold text-success">
                        {formatCurrency(investment.profit)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{calculateProgress(investment)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${calculateProgress(investment)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(investment.status)}>
                          {investment.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {investment.status === 'active' ? getDaysRemaining(investment.endDate) : 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(investment.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/investments/${investment.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          {investment.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openEndDialog(investment)}
                              className="text-warning hover:text-warning"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredInvestments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No investments found
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} investments
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* End Investment Dialog */}
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Investment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to end this investment? The user will receive their initial investment plus the full profit amount.
            </p>
            {endingInvestment && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Initial Amount:</span>
                  <span className="font-semibold">{formatCurrency(endingInvestment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit:</span>
                  <span className="font-semibold text-success">{formatCurrency(endingInvestment.profit)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total Payout:</span>
                  <span>{formatCurrency(parseFloat(endingInvestment.amount) + parseFloat(endingInvestment.profit))}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setEndDialogOpen(false);
                setEndingInvestment(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleEndInvestment}
            >
              End Investment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvestmentsPage;
