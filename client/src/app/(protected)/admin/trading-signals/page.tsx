'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Users, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import api, { handleAPIError, PagedResponse } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { User } from '@/types/user';
import { createSignalSchema, editSignalSchema } from '@/types/signal/signal.schema';
import { Signal, Subscription } from '@/types/signal';
import config from '@/lib/config';

interface SubscriberWithUser extends Subscription {
  user: User;
}

interface SignalFilters {
  currency: string;
  action: string;
}

interface SubscriberFilters {
  search: string;
}

const AdminTradingSignalsPage = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  
  // Pagination states
  const [signalsPagination, setSignalsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  
  const [subscribersPagination, setSubscribersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Filter states
  const [signalFilters, setSignalFilters] = useState<SignalFilters>({
    currency: '',
    action: 'all',
  });
  
  const [subscriberFilters, setSubscriberFilters] = useState<SubscriberFilters>({
    search: '',
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [deletingSignalId, setDeletingSignalId] = useState<string | null>(null);

  // Forms
  const createForm = useForm({
    resolver: zodResolver(createSignalSchema),
    defaultValues: {
      currency: '',
      action: 'Buy' as const,
      entryPrice: 0,
      tp1: 0,
      tp2: 0,
      sl: 0,
      scheduledAt: undefined,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(editSignalSchema),
    defaultValues: {
      currency: '',
      action: 'Buy' as const,
      entryPrice: 0,
      tp1: 0,
      tp2: 0,
      sl: 0,
      scheduledAt: undefined,
    },
  });

  // Fetch signals
  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: signalsPagination.page.toString(),
        limit: signalsPagination.limit.toString(),
        ...(signalFilters.currency && { currency: signalFilters.currency }),
        ...(signalFilters.action !== 'all' && { action: signalFilters.action }),
      });

      const response = await api.get<PagedResponse<Signal>>( `/trading-signals?${params}`);
      setSignals(response.data.data);
      setSignalsPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch {
      toast.error('Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, [signalsPagination.page, signalsPagination.limit, signalFilters]);

  // Fetch subscribers
  const fetchSubscribers = useCallback(async () => {
    try {
      setSubscribersLoading(true);
      const params = new URLSearchParams({
        page: subscribersPagination.page.toString(),
        limit: subscribersPagination.limit.toString(),
        ...(subscriberFilters.search && { search: subscriberFilters.search }),
      });

      const response = await api.get<PagedResponse<SubscriberWithUser>>(`/trading-signals/subscribers?${params}`);
      setSubscribers(response.data.data);
      setSubscribersPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch {
      toast.error('Failed to fetch subscribers');
    } finally {
      setSubscribersLoading(false);
    }
  }, [subscribersPagination.page, subscribersPagination.limit, subscriberFilters]);

  // Create signal
  const handleCreateSignal = async (data: z.infer<typeof createSignalSchema>) => {
    try {
      await api.post('/trading-signals', data);
      toast.success('Signal created successfully');
      setCreateDialogOpen(false);
      createForm.reset();
      fetchSignals();
    } catch(e) {
      handleAPIError<z.infer<typeof createSignalSchema>>(e, createForm)
      toast.error('Failed to create signal');
    }
  };

  // Edit signal
  const handleEditSignal = async (data: z.infer<typeof editSignalSchema>) => {
    if (!editingSignal) return;
    
    try {
      await api.put(`/trading-signals/${editingSignal.id}`, data);
      toast.success('Signal updated successfully');
      setEditDialogOpen(false);
      setEditingSignal(null);
      editForm.reset();
      fetchSignals();
    } catch {
      toast.error('Failed to update signal');
    }
  };

  // Delete signal
  const handleDeleteSignal = async () => {
    if (!deletingSignalId) return;
    
    try {
      await api.delete(`/trading-signals/${deletingSignalId}`);
      toast.success('Signal deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingSignalId(null);
      fetchSignals();
    } catch {
      toast.error('Failed to delete signal');
    }
  };

  // Open delete dialog
  const openDeleteDialog = (id: string) => {
    setDeletingSignalId(id);
    setDeleteDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (signal: Signal) => {
    setEditingSignal(signal);
    // Format date for datetime-local input
    const formatDateForInput = (date: Date | string | undefined) => {
      if (!date) return undefined;
      const d = typeof date === 'string' ? new Date(date) : date;
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    editForm.reset({
      currency: signal.currency,
      action: signal.action,
      entryPrice: parseFloat(signal.entryPrice),
      tp1: signal.tp1 ? parseFloat(signal.tp1) : 0,
      tp2: signal.tp2 ? parseFloat(signal.tp2) : undefined,
      sl: signal.sl ? parseFloat(signal.sl) : 0,
      scheduledAt: signal.scheduledAt ? new Date(signal.scheduledAt) : undefined,
    });
    
    // Set the datetime-local input value separately
    if (signal.scheduledAt) {
      const formattedDate = formatDateForInput(signal.scheduledAt);
      if (formattedDate) {
        // Set the input value after the form is reset
        setTimeout(() => {
          const input = document.getElementById('edit-scheduledAt') as HTMLInputElement;
          if (input) input.value = formattedDate;
        }, 0);
      }
    }
    setEditDialogOpen(true);
  };

  // Get status color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'Buy': return 'text-success bg-success/10';
      case 'Sell': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success bg-success/10';
      case 'expired': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trading Signals</h1>
          <p className="text-muted-foreground">Manage trading signals and subscribers</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Signal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-150">
            <DialogHeader>
              <DialogTitle>Create Trading Signal</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreateSignal)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    placeholder="e.g., BTCUSDT"
                    {...createForm.register('currency')}
                  />
                  {createForm.formState.errors.currency && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.currency.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="action">Action</Label>
                  <Select onValueChange={(value) => createForm.setValue('action', value as 'Buy' | 'Sell')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buy">Buy</SelectItem>
                      <SelectItem value="Sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                  {createForm.formState.errors.action && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.action.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Entry Price</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...createForm.register('entryPrice', { valueAsNumber: true })}
                  />
                  {createForm.formState.errors.entryPrice && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.entryPrice.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tp1">Target Price 1</Label>
                  <Input
                    id="tp1"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...createForm.register('tp1', { valueAsNumber: true })}
                  />
                  {createForm.formState.errors.tp1 && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.tp1.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tp2">Target Price 2 (Optional)</Label>
                  <Input
                    id="tp2"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...createForm.register('tp2', { valueAsNumber: true })}
                  />
                  {createForm.formState.errors.tp2 && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.tp2.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sl">Stop Loss</Label>
                  <Input
                    id="sl"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...createForm.register('sl', { valueAsNumber: true })}
                  />
                  {createForm.formState.errors.sl && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.sl.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled At (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  {...createForm.register('scheduledAt', { 
                    setValueAs: (value) => value ? new Date(value) : undefined 
                  })}
                />
                {createForm.formState.errors.scheduledAt && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.scheduledAt.message}</p>
                )}
              </div>

              {createForm.formState.errors.root && (
                <p className="text-sm text-destructive">{createForm.formState.errors.root.message}</p>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  {createForm.formState.isSubmitting ? 'Creating...' : 'Create Signal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          {/* Signals Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Filter Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input
                    placeholder="Search currency..."
                    value={signalFilters.currency}
                    onChange={(e) => setSignalFilters(prev => ({ ...prev, currency: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select 
                    value={signalFilters.action}
                    onValueChange={(value) => setSignalFilters(prev => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      <SelectItem value="Buy">Buy</SelectItem>
                      <SelectItem value="Sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline"
                    onClick={() => setSignalFilters({ currency: '', action: 'all' })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Signals ({signalsPagination.total})</CardTitle>
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
                        <TableHead>Currency</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entry Price</TableHead>
                        <TableHead>Target Price 1</TableHead>
                        <TableHead>Target Price 2</TableHead>
                        <TableHead>Stop Loss</TableHead>
                        <TableHead>Scheduled For</TableHead>
                        <TableHead>Published At</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signals.map((signal) => (
                        <TableRow key={signal.id}>
                          <TableCell className="font-medium">{signal.currency}</TableCell>
                          <TableCell>
                            <Badge className={getActionColor(signal.action)}>
                              {signal.action.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(signal.entryPrice)}</TableCell>
                          <TableCell>
                            {signal.tp1 ? formatCurrency(signal.tp1) : '-'}
                          </TableCell>
                          <TableCell>
                            {parseInt(signal.tp2 || '0') ? formatCurrency(signal.tp2 || '0') : '-'}
                          </TableCell>
                          <TableCell>
                            {signal.sl ? formatCurrency(signal.sl) : '-'}
                          </TableCell>
                          <TableCell>{signal.scheduledAt ? formatDate(signal.scheduledAt) : '-'}</TableCell>
                          <TableCell>{signal.publishedAt ? formatDate(signal.publishedAt) : '-'}</TableCell>
                          <TableCell>{formatDate(signal.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/admin/trading-signals/${signal.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              {!signal.publishedAt && <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditDialog(signal)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openDeleteDialog(signal.id.toString())}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {signals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No signals found
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {signalsPagination.total > signalsPagination.limit && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((signalsPagination.page - 1) * signalsPagination.limit) + 1} to{' '}
                    {Math.min(signalsPagination.page * signalsPagination.limit, signalsPagination.total)} of{' '}
                    {signalsPagination.total} signals
                  </p>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSignalsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={signalsPagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSignalsPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={signalsPagination.page >= Math.ceil(signalsPagination.total / signalsPagination.limit)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          {/* Subscribers Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Filter Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search by name or email..."
                    value={subscriberFilters.search}
                    onChange={(e) => setSubscriberFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline"
                    onClick={() => setSubscriberFilters({ search: '' })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscribers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subscribers ({subscribersPagination.total})</CardTitle>
            </CardHeader>
            <CardContent>
              {subscribersLoading ? (
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
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscribed</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Amount Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">
                            {subscriber.user.name}
                          </TableCell>
                          <TableCell>{subscriber.user.email}</TableCell>
                          <TableCell className="capitalize">{subscriber.plan}</TableCell>
                          <TableCell>
                            <Badge className={getSubscriptionStatusColor(subscriber.isActive ? 'active' : 'expired')}>
                              {subscriber.isActive ? 'ACTIVE' : 'EXPIRED'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(subscriber.startedAt)}</TableCell>
                          <TableCell>{formatDate(subscriber.endedAt)}</TableCell>
                          <TableCell>{formatCurrency(config.signals[subscriber.plan])}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {subscribers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No subscribers found
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {subscribersPagination.total > subscribersPagination.limit && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((subscribersPagination.page - 1) * subscribersPagination.limit) + 1} to{' '}
                    {Math.min(subscribersPagination.page * subscribersPagination.limit, subscribersPagination.total)} of{' '}
                    {subscribersPagination.total} subscribers
                  </p>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubscribersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={subscribersPagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubscribersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={subscribersPagination.page >= Math.ceil(subscribersPagination.total / subscribersPagination.limit)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Signal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>Edit Trading Signal</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSignal)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Input
                  id="edit-currency"
                  placeholder="e.g., BTCUSDT"
                  {...editForm.register('currency')}
                />
                {editForm.formState.errors.currency && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.currency.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-action">Action</Label>
                <Select 
                  value={editForm.watch('action')}
                  onValueChange={(value) => editForm.setValue('action', value as 'Buy' | 'Sell')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                {editForm.formState.errors.action && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.action.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-entryPrice">Entry Price</Label>
                <Input
                  id="edit-entryPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...editForm.register('entryPrice', { valueAsNumber: true })}
                />
                {editForm.formState.errors.entryPrice && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.entryPrice.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-tp1">Target Price 1</Label>
                <Input
                  id="edit-tp1"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...editForm.register('tp1', { valueAsNumber: true })}
                />
                {editForm.formState.errors.tp1 && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.tp1.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tp2">Target Price 2</Label>
                <Input
                  id="edit-tp2"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...editForm.register('tp2', { valueAsNumber: true })}
                />
                {editForm.formState.errors.tp2 && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.tp2.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-sl">Stop Loss</Label>
                <Input
                  id="edit-sl"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...editForm.register('sl', { valueAsNumber: true })}
                />
                {editForm.formState.errors.sl && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.sl.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-scheduledAt">Scheduled At (Optional)</Label>
              <Input
                id="edit-scheduledAt"
                type="datetime-local"
                {...editForm.register('scheduledAt', { 
                  setValueAs: (value) => value ? new Date(value) : undefined 
                })}
              />
              {editForm.formState.errors.scheduledAt && (
                <p className="text-sm text-destructive">{editForm.formState.errors.scheduledAt.message}</p>
              )}
            </div>

            {editForm.formState.errors.root && (
              <p className="text-sm text-destructive">{editForm.formState.errors.root.message}</p>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting ? 'Updating...' : 'Update Signal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Signal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this trading signal? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingSignalId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSignal}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTradingSignalsPage;
