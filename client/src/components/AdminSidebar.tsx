'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  ArrowLeftRight,
  Signal,
  Menu,
  X,
  Building2,
  LayoutDashboard,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminRoutes = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
  },
  {
    href: '/admin/accounts',
    label: 'Accounts',
    icon: Building2,
  },
  {
    href: '/admin/tickers',
    label: 'Tickers',
    icon: Coins,
  },
  {
    href: '/admin/deposits',
    label: 'Deposits',
    icon: CreditCard,
  },
  {
    href: '/admin/investments',
    label: 'Investments',
    icon: TrendingUp,
  },
  {
    href: '/admin/investment-plans',
    label: 'Investment Plans',
    icon: DollarSign,
  },
  {
    href: '/admin/withdrawals',
    label: 'Withdrawals',
    icon: ArrowLeftRight,
  },
  {
    href: '/admin/trading-signals',
    label: 'Trading Signals',
    icon: Signal,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
  },
];

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-background/95 backdrop-blur"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 transform border-r transition-transform duration-200 ease-in-out lg:translate-x-0",
          "bg-sidebar border-sidebar-border",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6 gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground leading-tight">Admin Panel</h2>
              <p className="text-[10px] text-muted-foreground leading-tight">InvestPro</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Back to user dashboard */}
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-3 text-sm font-medium border border-border text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-all duration-200 group"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
              <span>User Dashboard</span>
              <span className="ml-auto text-[10px] text-muted-foreground group-hover:text-foreground bg-muted px-1.5 py-0.5 rounded-md">User</span>
            </Link>

            <div className="pb-1">
              <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Admin
              </span>
            </div>

            {adminRoutes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === route.href || (route.href !== '/admin' && pathname.startsWith(route.href));

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {route.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
