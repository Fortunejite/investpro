'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, TrendingUp, DollarSign, Calendar, User, Pause } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { User as UserType } from '@/types/user';

interface InvestmentPlan {
  id: number;
  name: string;
  description?: string;
  roiPercent: number;
  durationInDays: number;
  payoutType: string;
}

interface Account {
  id: number;
  user: UserType;
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

const AdminInvestmentDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const investmentId = params.id as string;

  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);
  const [endDialogOpen, setEndDialogOpen] = useState(false);

  // Fetch investment details
  const fetchInvestment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Investment>(`/investments/${investmentId}`);
      setInvestment(response.data);
    } catch {
      toast.error('Failed to fetch investment details');
      router.push('/admin/investments');
    } finally {
      setLoading(false);
    }
  }, [investmentId, router]);

  // End investment
  const handleEndInvestment = async () => {
    if (!investment) return;
    
    try {
      await api.post(`/investments/${investment.id}/end`);
      toast.success('Investment ended successfully');
      setEndDialogOpen(false);
      fetchInvestment(); // Refresh data
    } catch {
      toast.error('Failed to end investment');
    }
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

  useEffect(() => {
    if (investmentId) {
      fetchInvestment();
    }
  }, [investmentId, fetchInvestment]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!investment) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Investment not found</p>
        <Button onClick={() => router.push('/admin/investments')} className="mt-4">
          Back to Investments
        </Button>
      </div>
    );
  }

  const progress = calculateProgress(investment);
  const daysRemaining = getDaysRemaining(investment.endDate);
  const totalPayout = parseFloat(investment.amount) + parseFloat(investment.profit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/admin/investments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Investments
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Investment Details</h1>
            <p className="text-muted-foreground">Detailed view of user investment</p>
          </div>
        </div>
        
        {investment.status === 'active' && (
          <Button 
            onClick={() => setEndDialogOpen(true)}
            className="bg-warning text-warning-foreground hover:bg-warning/90"
          >
            <Pause className="w-4 h-4 mr-2" />
            End Investment
          </Button>
        )}
      </div>

      {/* Investment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(investment.amount)}</div>
            <p className="text-xs text-muted-foreground">
              Initial investment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(investment.profit)}</div>
            <p className="text-xs text-muted-foreground">
              {investment.plan.roiPercent}% ROI
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalPayout)}</div>
            <p className="text-xs text-muted-foreground">
              Amount + Profit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="text-lg font-semibold">{investment.account.user.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-lg font-semibold">{investment.account.user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Account ID</Label>
              <p className="text-lg font-semibold">#{investment.accountId}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">User Role</Label>
              <Badge className="capitalize">
                {investment.account.user.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Investment Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Plan Name</Label>
              <p className="text-lg font-semibold">{investment.plan.name}</p>
            </div>
            {investment.plan.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm text-muted-foreground">{investment.plan.description}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">ROI Percentage</Label>
              <p className="text-lg font-semibold text-success">{investment.plan.roiPercent}%</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
              <p className="text-lg font-semibold">{investment.plan.durationInDays} days</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Payout Type</Label>
              <Badge className="capitalize">
                {investment.plan.payoutType.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Investment Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(investment.status)}>
                  {investment.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
              <p className="text-lg font-semibold">{formatDate(investment.startDate)}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
              <p className="text-lg font-semibold">{formatDate(investment.endDate)}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Days Remaining</Label>
              <p className="text-lg font-semibold">
                {investment.status === 'active' ? daysRemaining : 0} days
              </p>
            </div>
          </div>

          {investment.status === 'active' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm font-medium text-muted-foreground">Progress</Label>
                <span className="text-sm font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Investment Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <div>
                <p className="font-semibold">Investment Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(investment.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${investment.status === 'active' ? 'bg-primary' : 'bg-success'}`}></div>
              <div>
                <p className="font-semibold">Investment Started</p>
                <p className="text-sm text-muted-foreground">{formatDate(investment.startDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${
                investment.status === 'inactive' || investment.status === 'expired' 
                  ? 'bg-success' 
                  : 'bg-muted'
              }`}></div>
              <div>
                <p className="font-semibold">Investment End</p>
                <p className="text-sm text-muted-foreground">{formatDate(investment.endDate)}</p>
              </div>
            </div>
          </div>
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
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Initial Amount:</span>
                <span className="font-semibold">{formatCurrency(investment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Profit:</span>
                <span className="font-semibold text-success">{formatCurrency(investment.profit)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total Payout:</span>
                <span>{formatCurrency(totalPayout)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setEndDialogOpen(false)}
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

// Label component for consistency
const Label = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string }) => (
  <label className={`block text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);

export default AdminInvestmentDetailPage;
