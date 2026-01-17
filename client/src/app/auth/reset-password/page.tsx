"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, TrendingUp, Key, CheckCircle } from "lucide-react";
import { resetPasswordSchema } from "@/types/user/user.schema";
import { handleAPIError } from "@/types/api";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { z } from "zod";

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      token,
      newPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    // Clear any previous errors
    form.clearErrors();
    
    try {
      await api.post("/auth/reset-password", data);
      setIsSuccess(true);
    } catch (error: unknown) {
      // Handle API errors using utility function
      handleAPIError<ResetPasswordFormData>(error, form);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Password Reset Successful</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your password has been successfully updated. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/25">
                Sign In Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Reset Your Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your verification code and create a new secure password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10 h-12 border-border/50 focus:border-primary/50 bg-background/50"
                          disabled={isLoading}
                          readOnly={!!email}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Verification Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter 6-digit code"
                          className="pl-10 h-12 border-border/50 focus:border-primary/50 bg-background/50 text-center tracking-widest"
                          disabled={isLoading}
                          maxLength={6}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the 6-digit code sent to your email
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your new password"
                          className="pl-10 pr-10 h-12 border-border/50 focus:border-primary/50 bg-background/50"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must be at least 6 characters long
                    </p>
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                disabled={isLoading}
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
