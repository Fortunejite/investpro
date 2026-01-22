'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Eye, EyeOff, Save, Settings2, Mail, MessageSquare, Palette } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAppSelector, useAppDispatch } from '@/hooks/redux.hook';
import { fetchUser } from '@/redux/user.slice';
import { Separator } from '@radix-ui/react-dropdown-menu';
import ThemeSwitch from '@/components/ThemeSwitch';

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  telegramUserId: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const UserSettingsPage = () => {
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      telegramUserId: user?.telegramUserId || '',
    },
  });

  // Password form
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update profile
  const handleProfileUpdate = async (data: z.infer<typeof profileSchema>) => {
    try {
      setLoading(true);
      await api.put('/auth/me', data);
      toast.success('Profile updated successfully');
      await api.post('/auth/refresh', data);
      dispatch(fetchUser()); // Refresh user data
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const handlePasswordUpdate = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setLoading(true);
      await api.post('/auth/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated successfully');
      passwordForm.reset();
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Failed to update password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        telegramUserId: user.telegramUserId || '',
      });
    }
  }, [user, profileForm]);

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update your personal information and account details
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                  {/* Account Status */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/10">
                    <div className="space-y-1">
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-muted-foreground">Your account is currently active</p>
                    </div>
                    <Badge variant={user?.status === 'active' ? 'default' : 'secondary'}>
                      {user?.status || 'Unknown'}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      {...profileForm.register('name')}
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Telegram User ID */}
                  <div className="space-y-2">
                    <Label htmlFor="telegramUserId" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Telegram User ID
                    </Label>
                    <Input
                      id="telegramUserId"
                      placeholder="Enter your Telegram user ID (optional)"
                      {...profileForm.register('telegramUserId')}
                    />
                    {profileForm.formState.errors.telegramUserId && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.telegramUserId.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Link your Telegram account to receive trading signals and notifications
                    </p>
                  </div>

                  {profileForm.formState.errors.root && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.root.message}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={loading || profileForm.formState.isSubmitting}
                      className="min-w-32"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading || profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Password & Security
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Keep your account secure by using a strong password
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter your current password"
                        {...passwordForm.register('currentPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter your new password"
                        {...passwordForm.register('newPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        {...passwordForm.register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="p-4 border border-border rounded-lg bg-muted/10">
                    <h4 className="font-medium mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• At least 6 characters long</li>
                      <li>• Use a mix of letters, numbers, and symbols</li>
                      <li>• Avoid using personal information</li>
                      <li>• Don&apos;t reuse old passwords</li>
                    </ul>
                  </div>

                  {passwordForm.formState.errors.root && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.root.message}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={loading || passwordForm.formState.isSubmitting}
                      className="min-w-32"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {loading || passwordForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Security Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Security Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Login Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your active login sessions
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance & Theme
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customize your visual experience and interface preferences
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <ThemeSwitch />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/10">
                  <div className="space-y-1">
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-muted-foreground">
                      Change your preferred language
                    </p>
                  </div>
                  <Badge variant="secondary">English (Default)</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/10">
                  <div className="space-y-1">
                    <p className="font-medium">Timezone</p>
                    <p className="text-sm text-muted-foreground">
                      Set your local timezone for accurate timestamps
                    </p>
                  </div>
                  <Badge variant="secondary">Auto-detect</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Control how and when you receive notifications
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/10">
                  <div className="space-y-1">
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive trading signals and account updates via email
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/10">
                  <div className="space-y-1">
                    <p className="font-medium">Telegram Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications through Telegram
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/10">
                  <div className="space-y-1">
                    <p className="font-medium">Trading Signal Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Choose when to receive trading signal notifications
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserSettingsPage;
