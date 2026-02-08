"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  User,
  Mail,
  Calendar,
  DollarSign,
  Shield,
  Ban,
  UserCheck,
  Star,
  Edit,
  Trash,
  Target,
  Trophy,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api, { handleAPIError } from "@/lib/api";
import Loading from "@/components/Loading";
import { 
  User as UserType, 
  createTradingProfileSchema,
  updateTradingProfileSchema 
} from "@/types/user";
import { formatCurrency } from "@/lib/utils";

type CreateTradingProfileData = z.infer<typeof createTradingProfileSchema>;
type UpdateTradingProfileData = z.infer<typeof updateTradingProfileSchema>;

const UserDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // State management
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isCreateTraderOpen, setIsCreateTraderOpen] = useState(false);
  const [isEditTraderOpen, setIsEditTraderOpen] = useState(false);

  // Forms
  const createTraderForm = useForm({
    resolver: zodResolver(createTradingProfileSchema),
    defaultValues: {
      userId: parseInt(userId),
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

  // Fetch user details
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user details');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  // User actions
  const handleBanUser = async (currentStatus: string) => {
    if (!user) return;

    try {
      const endpoint = currentStatus === 'banned' ? 'unban' : 'ban';
      await api.patch(`/users/${user.id}/${endpoint}`);
      toast.success(`User ${endpoint}ned successfully`);
      fetchUser();
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
      fetchUser();
    } catch (error) {
      handleAPIError<CreateTradingProfileData>(error, createTraderForm);
      console.error('Error creating trading profile:', error);
      toast.error('Failed to create trading profile');
    }
  };

  const handleEditTrader = async (data: UpdateTradingProfileData) => {
    if (!user?.tradingProfile) return;
    
    try {
      await api.put(`/traders/${user.tradingProfile.id}`, data);
      toast.success('Trading profile updated successfully');
      setIsEditTraderOpen(false);
      editTraderForm.reset();
      fetchUser();
    } catch (error) {
      handleAPIError<UpdateTradingProfileData>(error, editTraderForm);
      console.error('Error updating trading profile:', error);
      toast.error('Failed to update trading profile');
    }
  };

  const handleDeleteTrader = async () => {
    if (!user) return;

    try {
      await api.delete(`/traders/${user.id}`);
      toast.success('Trading profile deleted successfully');
      fetchUser();
    } catch (error) {
      console.error('Error deleting trading profile:', error);
      toast.error('Failed to delete trading profile');
    }
  };

  // Handle edit trader
  const handleOpenEditTrader = () => {
    if (!user?.tradingProfile) return;
    
    editTraderForm.reset({
      bio: user.tradingProfile.bio || "",
      profitSharePercent: Number(user.tradingProfile.profitSharePercent),
      totalProfit: Number(user.tradingProfile.totalProfit),
      winRate: Number(user.tradingProfile.winRate),
      totalTrades: user.tradingProfile.totalTrades,
      successfulTrades: user.tradingProfile.successfulTrades,
      minCapital: Number(user.tradingProfile.minCapital),
    });
    setIsEditTraderOpen(true);
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
      user: User,
      trader: Star,
      admin: Shield,
    };

    const Icon = icons[role as keyof typeof icons] || User;

    return (
      <Badge variant={variants[role as keyof typeof variants] || "secondary"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  // Format percentage
  const formatPercentage = (value: string | number) => {
    return `${Number(value).toFixed(2)}%`;
  };

  // Initialize
  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">User not found</h3>
          <p className="text-muted-foreground mb-4">The user you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/admin/users">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground">User Management</p>
        </div>
        <Button 
          onClick={fetchUser} 
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p>{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="mt-1">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={user.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telegram ID</label>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <p>{user.telegramUserId || 'Not connected'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registered</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Balance */}
          {user.account && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Account Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(user.account.availableBalance)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Locked Balance</p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {formatCurrency(user.account.lockedBalance)}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trading Profile */}
          {user.tradingProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Trading Profile
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleOpenEditTrader}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
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
                            onClick={handleDeleteTrader}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(user.tradingProfile.totalProfit)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Profit</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatPercentage(user.tradingProfile.winRate)}
                    </p>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {user.tradingProfile.totalTrades}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Successful Trades</label>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {user.tradingProfile.successfulTrades}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Profit Share</label>
                    <p className="text-lg font-semibold">
                      {formatPercentage(user.tradingProfile.profitSharePercent)}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Minimum Capital</label>
                    <p className="text-lg font-semibold">
                      {formatCurrency(user.tradingProfile.minCapital)}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                {user.tradingProfile.bio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bio</label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm">{user.tradingProfile.bio}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Create Trading Profile */}
              {user.role === 'user' && !user.tradingProfile && (
                <Button 
                  onClick={() => setIsCreateTraderOpen(true)}
                  className="w-full justify-start"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Create Trading Profile
                </Button>
              )}

              {/* Ban/Unban User */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={user.status === 'banned' ? 'default' : 'destructive'} 
                    className="w-full justify-start"
                  >
                    {user.status === 'banned' ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Unban User
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Ban User
                      </>
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
                      onClick={() => handleBanUser(user.status)}
                      className={user.status === 'banned' ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
                    >
                      {user.status === 'banned' ? 'Unban' : 'Ban'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Assets</span>
                  <span className="font-medium">{user.assets?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Trading Profile Dialog */}
      <Dialog open={isCreateTraderOpen} onOpenChange={setIsCreateTraderOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Trading Profile for {user.name}</DialogTitle>
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
        <DialogContent className="max-w-2xl">
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

export default UserDetailsPage;
