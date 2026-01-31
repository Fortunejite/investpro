"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Search,
  RefreshCw,
  Ban,
  UserCheck,
  Star,
  Trash,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api, { handleAPIError, PagedResponse } from "@/lib/api";
import Loading from "@/components/Loading";
import { 
  User, 
  UserFilters,
  createTradingProfileSchema,
  updateTradingProfileSchema 
} from "@/types/user";
import { formatCurrency } from "@/lib/utils";

type CreateTradingProfileData = z.infer<typeof createTradingProfileSchema>;
type UpdateTradingProfileData = z.infer<typeof updateTradingProfileSchema>;

const UsersPage = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    status: "all",
    role: "all",
    page: 1,
    limit: 10,
  });

  // Dialog states
  const [isCreateTraderOpen, setIsCreateTraderOpen] = useState(false);
  const [isEditTraderOpen, setIsEditTraderOpen] = useState(false);

  // Debounce search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Forms
  const createTraderForm = useForm({
    resolver: zodResolver(createTradingProfileSchema),
    defaultValues: {
      userId: 0,
      bio: "",
      profitSharePercent: 0,
      totalProfit: 0,
      winRate: 0,
      totalTrades: 0,
      successfulTrades: 0,
      minCapital: 0,
    },
  });

  const editTraderForm = useForm({
    resolver: zodResolver(updateTradingProfileSchema),
    defaultValues: {
      bio: "",
      profitSharePercent: 0,
      totalProfit: 0,
      winRate: 0,
      totalTrades: 0,
      successfulTrades: 0,
      minCapital: 0,
    },
  });

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 300);
  }, []);

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role);
      queryParams.append('page', filters.page?.toString() || '1');
      queryParams.append('limit', filters.limit?.toString() || '10');

      const response = await api.get<PagedResponse<User>>(`/users?${queryParams.toString()}`);

      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // User actions
  const handleBanUser = async (userId: number, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'banned' ? 'unban' : 'ban';
      await api.patch(`/users/${userId}/${endpoint}`);
      toast.success(`User ${endpoint}ned successfully`);
      fetchUsers();
    } catch (error) {
      console.error(`Error ${currentStatus === 'banned' ? 'unbanning' : 'banning'} user:`, error);
      toast.error(`Failed to ${currentStatus === 'banned' ? 'unban' : 'ban'} user`);
    }
  };

  // Trading profile actions
  const handleCreateTrader = async (data: CreateTradingProfileData) => {
    try {
      await api.post('/traders', data);
      toast.success('Trading profile created successfully');
      setIsCreateTraderOpen(false);
      createTraderForm.reset();
      fetchUsers();
    } catch (error) {
      handleAPIError<CreateTradingProfileData>(error, createTraderForm);
      console.error('Error creating trading profile:', error);
      toast.error('Failed to create trading profile');
    }
  };

  const handleEditTrader = async (data: UpdateTradingProfileData) => {
    // This function is no longer needed since we use the dedicated page
    // But keeping it for the form components that might still reference it
    console.log('Edit trader data:', data);
  };

  const handleDeleteTrader = async (userId: number) => {
    try {
      await api.delete(`/traders/${userId}`);
      toast.success('Trading profile deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting trading profile:', error);
      toast.error('Failed to delete trading profile');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      banned: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Role badge component
  const RoleBadge = ({ role }: { role: string }) => {
    const variants = {
      user: "secondary",
      trader: "outline",
      admin: "default",
    } as const;

    const icons = {
      user: Users,
      trader: Star,
      admin: Shield,
    };

    const Icon = icons[role as keyof typeof icons] || Users;

    return (
      <Badge variant={variants[role as keyof typeof variants] || "secondary"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  // Initialize
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search input
  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle create trader
  const handleOpenCreateTrader = (user: User) => {
    createTraderForm.setValue('userId', user.id);
    setIsCreateTraderOpen(true);
  };

  if (loading && users.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, trading profiles, and permissions
          </p>
        </div>
        
        <Button 
          onClick={fetchUsers} 
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as "all" | "active" | "inactive" | "banned", page: 1 }))}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value as "all" | "user" | "admin" | "trader", page: 1 }))}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="trader">Trader</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">
                          {user.account ? formatCurrency(user.account.availableBalance) : '$0.00'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {user.role === 'user' && !user.tradingProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenCreateTrader(user)}
                              title="Create Trading Profile"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}

                          {user.role === 'trader' && user.tradingProfile && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Delete Trading Profile"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Trading Profile</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will delete the trading profile for {user.name} and change their role back to user. 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTrader(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title={user.status === 'banned' ? 'Unban User' : 'Ban User'}
                              >
                                {user.status === 'banned' ? (
                                  <UserCheck className="h-4 w-4" />
                                ) : (
                                  <Ban className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {user.status === 'banned' ? 'Unban' : 'Ban'} User
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {user.status === 'banned' ? 'unban' : 'ban'} {user.name}?
                                  {user.status !== 'banned' && ' This will prevent them from accessing their account.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleBanUser(user.id, user.status)}
                                  className={user.status === 'banned' ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
                                >
                                  {user.status === 'banned' ? 'Unban' : 'Ban'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page * pagination.limit >= pagination.total}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Trading Profile Dialog */}
      <Dialog open={isCreateTraderOpen} onOpenChange={setIsCreateTraderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Trading Profile</DialogTitle>
          </DialogHeader>
          <Form {...createTraderForm}>
            <form onSubmit={createTraderForm.handleSubmit(handleCreateTrader)} className="space-y-4">
              <FormField
                control={createTraderForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter trader bio..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createTraderForm.control}
                  name="profitSharePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Share (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={100} 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createTraderForm.control}
                  name="winRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Win Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={100} 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createTraderForm.control}
                  name="totalTrades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Trades</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createTraderForm.control}
                  name="successfulTrades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Successful Trades</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createTraderForm.control}
                  name="totalProfit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Profit ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          step={0.01} 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createTraderForm.control}
                  name="minCapital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Capital ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          step={0.01} 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateTraderOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Profile
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Trading Profile Dialog */}
      <Dialog open={isEditTraderOpen} onOpenChange={setIsEditTraderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trading Profile</DialogTitle>
          </DialogHeader>
          <Form {...editTraderForm}>
            <form onSubmit={editTraderForm.handleSubmit(handleEditTrader)} className="space-y-4">
              <FormField
                control={editTraderForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter trader bio..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editTraderForm.control}
                  name="profitSharePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Share (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editTraderForm.control}
                  name="winRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Win Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editTraderForm.control}
                  name="totalTrades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Trades</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editTraderForm.control}
                  name="successfulTrades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Successful Trades</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editTraderForm.control}
                  name="totalProfit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Profit ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editTraderForm.control}
                  name="minCapital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Capital ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditTraderOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Profile
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
