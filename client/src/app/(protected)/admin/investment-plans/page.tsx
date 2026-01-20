'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, TrendingUp, Clock, Target, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const createPlanSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  minAmount: z.number().positive('Minimum amount must be positive'),
  durationInDays: z.number().int().positive('Duration must be a positive number'),
  roiPercent: z.number().positive('ROI percentage must be positive'),
  payoutType: z.enum(['daily', 'weekly', 'monthly', 'end_of_term']),
});

const updatePlanSchema = createPlanSchema.extend({
  isActive: z.boolean().optional(),
});

interface InvestmentPlan {
  id: number;
  name: string;
  description?: string;
  minAmount: number;
  durationInDays: number;
  roiPercent: number;
  payoutType: 'daily' | 'weekly' | 'monthly' | 'end_of_term';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminInvestmentPlansPage = () => {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  // Filter state
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Forms
  const createForm = useForm({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      minAmount: 0,
      durationInDays: 0,
      roiPercent: 0,
      payoutType: 'end_of_term' as const,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(updatePlanSchema),
    defaultValues: {
      name: '',
      description: '',
      minAmount: 0,
      durationInDays: 0,
      roiPercent: 0,
      payoutType: 'end_of_term' as const,
      isActive: true,
    },
  });

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }

      const response = await api.get<{ data: InvestmentPlan[] }>(`/investment-plans/admin?${params}`);
      setPlans(response.data.data);
    } catch {
      toast.error('Failed to fetch investment plans');
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  // Create plan
  const handleCreatePlan = async (data: z.infer<typeof createPlanSchema>) => {
    try {
      await api.post('/investment-plans', data);
      toast.success('Investment plan created successfully');
      setCreateDialogOpen(false);
      createForm.reset();
      fetchPlans();
    } catch {
      toast.error('Failed to create investment plan');
    }
  };

  // Edit plan
  const handleEditPlan = async (data: z.infer<typeof updatePlanSchema>) => {
    if (!editingPlan) return;
    
    try {
      await api.put(`/investment-plans/${editingPlan.id}`, data);
      toast.success('Investment plan updated successfully');
      setEditDialogOpen(false);
      setEditingPlan(null);
      editForm.reset();
      fetchPlans();
    } catch {
      toast.error('Failed to update investment plan');
    }
  };

  // Delete plan
  const handleDeletePlan = async () => {
    if (!deletingPlanId) return;
    
    try {
      await api.delete(`/investment-plans/${deletingPlanId}`);
      toast.success('Investment plan deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingPlanId(null);
      fetchPlans();
    } catch {
      toast.error('Failed to delete investment plan');
    }
  };

  // Open edit dialog
  const openEditDialog = (plan: InvestmentPlan) => {
    setEditingPlan(plan);
    editForm.reset({
      name: plan.name,
      description: plan.description || '',
      minAmount: plan.minAmount,
      durationInDays: plan.durationInDays,
      roiPercent: plan.roiPercent,
      payoutType: plan.payoutType,
      isActive: plan.isActive,
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (id: number) => {
    setDeletingPlanId(id);
    setDeleteDialogOpen(true);
  };

  // Get status color
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-success bg-success/10' : 'text-muted-foreground bg-muted';
  };

  const getPayoutTypeColor = (payoutType: string) => {
    switch (payoutType) {
      case 'daily': return 'text-info bg-info/10';
      case 'weekly': return 'text-warning bg-warning/10';
      case 'monthly': return 'text-secondary bg-secondary/10';
      case 'end_of_term': return 'text-primary bg-primary/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const filteredPlans = plans.filter(plan => {
    if (filterActive === 'all') return true;
    return filterActive === 'active' ? plan.isActive : !plan.isActive;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investment Plans</h1>
          <p className="text-muted-foreground">Manage investment plans and returns</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Investment Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreatePlan)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Basic Plan"
                    {...createForm.register('name')}
                  />
                  {createForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Minimum Amount ($)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    {...createForm.register('minAmount', { valueAsNumber: true })}
                  />
                  {createForm.formState.errors.minAmount && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.minAmount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Plan description and benefits..."
                  rows={3}
                  {...createForm.register('description')}
                />
                {createForm.formState.errors.description && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationInDays">Duration (Days)</Label>
                  <Input
                    id="durationInDays"
                    type="number"
                    placeholder="30"
                    {...createForm.register('durationInDays', { valueAsNumber: true })}
                  />
                  {createForm.formState.errors.durationInDays && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.durationInDays.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="roiPercent">ROI Percentage</Label>
                  <Input
                    id="roiPercent"
                    type="number"
                    step="0.1"
                    placeholder="10.5"
                    {...createForm.register('roiPercent', { valueAsNumber: true })}
                  />
                  {createForm.formState.errors.roiPercent && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.roiPercent.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payoutType">Payout Type</Label>
                  <Select onValueChange={(value) => createForm.setValue('payoutType', value as 'daily' | 'weekly' | 'monthly' | 'end_of_term')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="end_of_term">End of Term</SelectItem>
                    </SelectContent>
                  </Select>
                  {createForm.formState.errors.payoutType && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.payoutType.message}</p>
                  )}
                </div>
              </div>

              {createForm.formState.errors.root && (
                <p className="text-sm text-destructive">{createForm.formState.errors.root.message}</p>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  {createForm.formState.isSubmitting ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">
              {plans.filter(p => p.isActive).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg ROI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.length > 0 ? (plans.reduce((acc, p) => acc + p.roiPercent, 0) / plans.length).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all plans
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.length > 0 ? Math.round(plans.reduce((acc, p) => acc + p.durationInDays, 0) / plans.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Days average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Min Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(plans.length > 0 ? Math.min(...plans.map(p => p.minAmount)) : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Lowest minimum
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Filter Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filterActive}
                onValueChange={(value) => setFilterActive(value as 'all' | 'active' | 'inactive')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Plans ({filteredPlans.length})</CardTitle>
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
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Minimum Amount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>Payout Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(plan.minAmount)}</TableCell>
                      <TableCell>{plan.durationInDays} days</TableCell>
                      <TableCell className="font-semibold text-success">
                        {plan.roiPercent}%
                      </TableCell>
                      <TableCell>
                        <Badge className={getPayoutTypeColor(plan.payoutType)}>
                          {plan.payoutType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(plan.isActive)}>
                          {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openDeleteDialog(plan.id)}
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

              {filteredPlans.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No investment plans found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Investment Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditPlan)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Plan Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Basic Plan"
                  {...editForm.register('name')}
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-minAmount">Minimum Amount ($)</Label>
                <Input
                  id="edit-minAmount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  {...editForm.register('minAmount', { valueAsNumber: true })}
                />
                {editForm.formState.errors.minAmount && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.minAmount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Plan description and benefits..."
                rows={3}
                {...editForm.register('description')}
              />
              {editForm.formState.errors.description && (
                <p className="text-sm text-destructive">{editForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-durationInDays">Duration (Days)</Label>
                <Input
                  id="edit-durationInDays"
                  type="number"
                  placeholder="30"
                  {...editForm.register('durationInDays', { valueAsNumber: true })}
                />
                {editForm.formState.errors.durationInDays && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.durationInDays.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-roiPercent">ROI Percentage</Label>
                <Input
                  id="edit-roiPercent"
                  type="number"
                  step="0.1"
                  placeholder="10.5"
                  {...editForm.register('roiPercent', { valueAsNumber: true })}
                />
                {editForm.formState.errors.roiPercent && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.roiPercent.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-payoutType">Payout Type</Label>
                <Select 
                  value={editForm.watch('payoutType')}
                  onValueChange={(value) => editForm.setValue('payoutType', value as 'daily' | 'weekly' | 'monthly' | 'end_of_term')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="end_of_term">End of Term</SelectItem>
                  </SelectContent>
                </Select>
                {editForm.formState.errors.payoutType && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.payoutType.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="edit-isActive"
                type="checkbox"
                {...editForm.register('isActive')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-isActive">Plan is active</Label>
            </div>

            {editForm.formState.errors.root && (
              <p className="text-sm text-destructive">{editForm.formState.errors.root.message}</p>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting ? 'Updating...' : 'Update Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Investment Plan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this investment plan? This action cannot be undone and may affect existing investments.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingPlanId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeletePlan}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvestmentPlansPage;
