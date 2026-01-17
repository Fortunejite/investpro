"use client";

import { TrendingUp, BarChart3, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "full";
  variant?: "default" | "minimal" | "splash";
  message?: string;
  className?: string;
}

export default function Loading({ 
  size = "md", 
  variant = "default", 
  message = "Loading...",
  className 
}: LoadingProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (variant === "splash") {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/10 rounded-full blur-2xl animate-pulse animation-delay-1000" />
        </div>

        <div className="relative z-10 text-center space-y-8 animate-fade-in">
          {/* Logo/Brand Icon */}
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 animate-float">
            <TrendingUp className="w-10 h-10 text-primary animate-pulse" />
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Investment Platform
            </h1>
            <p className="text-muted-foreground text-lg">
              Building your financial future
            </p>
          </div>

          {/* Animated Icons */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="animate-bounce animation-delay-0">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="animate-bounce animation-delay-200">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
            <div className="animate-bounce animation-delay-400">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
          </div>

          {/* Loading Spinner */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-primary/30" />
            </div>
            <p className="text-muted-foreground text-sm font-medium animate-pulse">
              {message}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-linear-to-r from-primary to-accent animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  const sizeClasses = {
    sm: "space-y-3",
    md: "space-y-4", 
    lg: "space-y-6",
    full: "min-h-screen space-y-8"
  };

  const spinnerSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16", 
    full: "h-20 w-20"
  };

  const iconSizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    full: "w-24 h-24"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      sizeClasses[size],
      size === "full" && "bg-linear-to-br from-background via-background to-muted/30",
      className
    )}>
      {/* Background decorative elements for full size */}
      {size === "full" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>
      )}

      <div className="relative z-10 space-y-6">
        {/* Main Icon */}
        <div className={cn(
          "mx-auto bg-primary/10 rounded-2xl flex items-center justify-center animate-float",
          iconSizes[size]
        )}>
          <TrendingUp className={cn(
            "text-primary animate-pulse",
            size === "sm" ? "w-6 h-6" : 
            size === "md" ? "w-8 h-8" :
            size === "lg" ? "w-10 h-10" : "w-12 h-12"
          )} />
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className={cn(
              "animate-spin rounded-full border-4 border-primary/20 border-t-primary",
              spinnerSizes[size]
            )} />
            <div className={cn(
              "absolute inset-0 animate-ping rounded-full border-2 border-primary/30",
              spinnerSizes[size]
            )} />
          </div>
        </div>

        {/* Loading Message */}
        <div className="space-y-2">
          <p className={cn(
            "text-foreground font-medium animate-pulse",
            size === "sm" ? "text-sm" :
            size === "md" ? "text-base" :
            size === "lg" ? "text-lg" : "text-xl"
          )}>
            {message}
          </p>
          {size !== "sm" && (
            <p className="text-muted-foreground text-sm">
              Please wait a moment...
            </p>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-400" />
        </div>
      </div>
    </div>
  );
}

// Additional loading component variants for specific use cases

export function ButtonLoading({ size = "sm" }: { size?: "sm" | "md" }) {
  const spinnerSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  
  return (
    <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", spinnerSize)} />
  );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/6" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function CardLoading() {
  return (
    <div className="border rounded-lg p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded w-full" />
        <div className="flex space-x-4">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}
