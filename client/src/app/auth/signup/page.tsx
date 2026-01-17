"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, TrendingUp } from "lucide-react";
import { registerSchema } from "@/types/user/user.schema";
import { handleAPIError } from "@/types/api";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { z } from "zod";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    // Clear any previous errors
    form.clearErrors();
    
    try {
      await api.post("/auth/register", data);
      // Handle successful registration - redirect to login or dashboard
      window.location.href = "/auth/login";
    } catch (error: unknown) {
      // Handle API errors using utility function
      handleAPIError<RegisterFormData>(error, form);
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle className="text-2xl font-bold text-foreground">Create Your Account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Join our investment platform and start building your financial future
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter your full name"
                          className="pl-10 h-12 border-border/50 focus:border-primary/50 bg-background/50"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

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
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
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
