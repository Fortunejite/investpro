"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  User,
  Mail,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Copy,
  CheckCircle,
  AlertCircle,
  UserCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { useAppSelector, useAppDispatch } from "@/hooks/redux.hook";
import { api, handleAPIError } from "@/lib/api";
import { updateUserProfile } from "@/types/user/user.schema";
import { fetchUser } from "@/redux/user.slice";
import { toast } from "sonner";
import type { z } from "zod";
import type { User as UserType } from "@/types/user";
import { formatDate } from "@/lib/utils";

type UpdateUserProfileData = z.infer<typeof updateUserProfile>;

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateUserProfileData>({
    resolver: zodResolver(updateUserProfile),
    defaultValues: {
      name: user?.name || "",
      telegramUserId: user?.telegramUserId || "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        telegramUserId: user.telegramUserId || "",
      });
    }
  }, [user, form]);

  // Handle form submission
  const onSubmit = async (data: UpdateUserProfileData) => {
    if (!user) return;

    setIsSubmitting(true);
    form.clearErrors();

    try {
      // Filter out empty optional fields
      const updateData: Partial<UpdateUserProfileData> = {};
      if (data.name && data.name !== user.name) {
        updateData.name = data.name;
      }
      if (data.telegramUserId !== undefined && data.telegramUserId !== user.telegramUserId) {
        updateData.telegramUserId = data.telegramUserId || undefined;
      }

      // Only submit if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        setIsEditing(false);
        return;
      }

      const response = await api.put<UserType>("/auth/me", updateData);
      await api.post('/auth/refresh');
      // Refresh user data instead of manually setting
      dispatch(fetchUser());
      
      // Reset form with updated data
      form.reset({
        name: response.data.name,
        telegramUserId: response.data.telegramUserId || "",
      });
      
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      
    } catch (error: unknown) {
      // Use the reusable handleAPIError utility
      handleAPIError<UpdateUserProfileData>(error, form);
      
      // Also show toast for better user feedback
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message);
        } else {
          toast.error("Failed to update profile. Please try again.");
        }
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    form.reset({
      name: user?.name || "",
      telegramUserId: user?.telegramUserId || "",
    });
    form.clearErrors();
    setIsEditing(false);
  };


  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'banned':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserCircle className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
              </div>

              <div className="border-t border-border my-4"></div>

              {/* Member Since */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Member Since</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </p>
              </div>

              {/* Last Updated */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Last Updated</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and account preferences.
                </CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={user.email}
                          readOnly
                          className="pl-10 bg-muted/50"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(user.email)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email address cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="Enter your full name"
                              className="pl-10"
                              readOnly={!isEditing}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Telegram User ID */}
                  <FormField
                    control={form.control}
                    name="telegramUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram User ID</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Send className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="Enter your Telegram User ID"
                              className="pl-10"
                              readOnly={!isEditing}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your Telegram User ID is needed to receive trading signal notifications.
                          {field.value && (
                            <span className="block mt-1 text-success">
                              ✓ You&apos;ll receive trading signals on this Telegram ID
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Telegram Instructions */}
                  {isEditing && (
                    <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-info shrink-0 mt-0.5" />
                        <div className="text-sm text-info-foreground">
                          <p className="font-medium mb-2">How to find your Telegram User ID:</p>
                          <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Open Telegram and search for &quot;@userinfobot&quot;</li>
                            <li>Start a chat with the bot</li>
                            <li>Send any message to the bot</li>
                            <li>The bot will reply with your User ID</li>
                            <li>Copy the number and paste it here</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {form.formState.errors.root && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex items-center space-x-3 pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
