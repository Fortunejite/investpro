// Usage Examples for the Loading Component

import Loading, { ButtonLoading, TableLoading, CardLoading } from '@/components/Loading';
import { useState } from 'react';

// Example 1: Full page splash screen (perfect for app initialization)
export function SplashExample() {
  return (
    <Loading 
      variant="splash" 
      message="Initializing your investment dashboard..." 
    />
  );
}

// Example 2: Page loading with different sizes
export function PageLoadingExamples() {
  return (
    <div className="space-y-8">
      {/* Small loading */}
      <Loading size="sm" message="Loading data..." />
      
      {/* Medium loading (default) */}
      <Loading size="md" message="Processing your request..." />
      
      {/* Large loading */}
      <Loading size="lg" message="Setting up your portfolio..." />
      
      {/* Full screen loading */}
      <Loading size="full" message="Loading dashboard..." />
    </div>
  );
}

// Example 3: Minimal loading for components
export function MinimalLoadingExample() {
  return (
    <div className="p-4">
      <Loading variant="minimal" className="my-4" />
    </div>
  );
}

// Example 4: Button loading states
export function ButtonLoadingExample() {
  return (
    <div className="space-x-4">
      <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded">
        <ButtonLoading size="sm" />
        <span>Loading...</span>
      </button>
      
      <button className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded">
        <ButtonLoading size="md" />
        <span>Processing...</span>
      </button>
    </div>
  );
}

// Example 5: Table loading skeleton
export function TableLoadingExample() {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Investment Portfolio</h3>
      <TableLoading rows={8} />
    </div>
  );
}

// Example 6: Card loading skeleton  
export function CardLoadingExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CardLoading />
      <CardLoading />
      <CardLoading />
    </div>
  );
}

// Example 8: Loading with custom messages based on context
export function ContextualLoadingExample() {
  const loadingMessages = {
    login: "Authenticating your account...",
    dashboard: "Loading your investment portfolio...",
    transactions: "Fetching transaction history...",
    analytics: "Calculating performance metrics...",
    settings: "Updating your preferences..."
  };
  
  const [context] = useState<keyof typeof loadingMessages>('login');
  
  return (
    <Loading 
      size="lg" 
      message={loadingMessages[context]}
      variant="default"
    />
  );
}
