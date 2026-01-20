'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import api, { PagedResponse } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Signal, SignalDeliveryWithUser } from '@/types/signal';

const AdminSignalDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const signalId = params.id as string;

  const [signal, setSignal] = useState<Signal | null>(null);
  const [deliveries, setDeliveries] = useState<SignalDeliveryWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Fetch signal details
  const fetchSignal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Signal>(`/trading-signals/${signalId}`);
      setSignal(response.data);
    } catch {
      toast.error('Failed to fetch signal details');
      router.push('/admin/trading-signals');
    } finally {
      setLoading(false);
    }
  }, [signalId, router]);

  // Fetch signal deliveries
  const fetchDeliveries = useCallback(async () => {
    try {
      setDeliveriesLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await api.get<PagedResponse<SignalDeliveryWithUser>>(`/trading-signals/${signalId}/deliveries?${params}`);
      setDeliveries(response.data.data);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch {
      toast.error('Failed to fetch deliveries');
    } finally {
      setDeliveriesLoading(false);
    }
  }, [signalId, pagination.page, pagination.limit]);

  // Get status colors
  const getActionColor = (action: string) => {
    switch (action) {
      case 'Buy': return 'text-success bg-success/10';
      case 'Sell': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-success bg-success/10';
      case 'queued': return 'text-warning bg-warning/10';
      case 'failed': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  useEffect(() => {
    if (signalId) {
      fetchSignal();
      fetchDeliveries();
    }
  }, [signalId, fetchSignal, fetchDeliveries]);

  useEffect(() => {
    if (signalId) {
      fetchDeliveries();
    }
  }, [fetchDeliveries, signalId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Signal not found</p>
        <Button onClick={() => router.push('/admin/trading-signals')} className="mt-4">
          Back to Signals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/admin/trading-signals')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Signals
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Signal Details</h1>
            <p className="text-muted-foreground">View signal information and delivery status</p>
          </div>
        </div>
      </div>

      {/* Signal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Signal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
                <p className="text-lg font-semibold">{signal.currency}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Action</Label>
                <div className="mt-1">
                  <Badge className={getActionColor(signal.action)}>
                    {signal.action.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Entry Price</Label>
                <p className="text-lg font-semibold">{formatCurrency(signal.entryPrice)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Target Prices</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(signal.tp1)}
                  {parseInt(signal.tp2 || '0') ? ` - ${formatCurrency(signal.tp2 || '0')}` : ''}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Stop Loss</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(signal.sl)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p className="text-lg font-semibold">{formatDate(signal.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Signal Deliveries ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveriesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Delivered At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">
                        {delivery.user.name}
                      </TableCell>
                      <TableCell>{delivery.user.email}</TableCell>
                      <TableCell>
                        <Badge className={getDeliveryStatusColor(delivery.status)}>
                          {delivery.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(delivery.createdAt)}</TableCell>
                      <TableCell>
                        {delivery.lastAttempt ? formatDate(delivery.lastAttempt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {deliveries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No deliveries found for this signal
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
                {pagination.total} deliveries
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
    </div>
  );
};

// Label component for consistency
const Label = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string }) => (
  <label className={`block text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);

export default AdminSignalDetailPage;
