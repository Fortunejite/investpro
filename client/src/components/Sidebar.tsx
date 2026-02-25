'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { navItems } from '@/lib/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/redux.hook';
import { logout } from '@/redux/user.slice';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

// Group nav items into sections
const navSections = [
  {
    label: 'Overview',
    items: navItems.filter((i) => ['Dashboard'].includes(i.name)),
  },
  {
    label: 'Trading',
    items: navItems.filter((i) => ['Markets', 'Trades', 'Copy Trading', 'Signals'].includes(i.name)),
  },
  {
    label: 'Finance',
    items: navItems.filter((i) => ['Deposit', 'Withdraw', 'Swap', 'Invest'].includes(i.name)),
  },
];

export default function Sidebar({ isCollapsed = false, onToggle, className }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.user);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/auth/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'h-full flex flex-col border-r transition-all duration-300 ease-in-out',
          'bg-sidebar border-sidebar-border',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border shrink-0">
          {isCollapsed ? (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shrink-0">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-base text-sidebar-foreground leading-tight truncate">
                  InvestPro
                </div>
                <div className="text-xs text-muted-foreground leading-tight">Trading Platform</div>
              </div>
            </Link>
          )}

          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn(
                'h-8 w-8 shrink-0 text-muted-foreground hover:text-sidebar-foreground hover:bg-accent',
                isCollapsed && 'hidden'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Collapsed expand button */}
        {isCollapsed && onToggle && (
          <div className="flex justify-center pt-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-muted-foreground hover:text-sidebar-foreground hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <nav className="px-3 space-y-5">
            {navSections.map((section) => (
              <div key={section.label}>
                {/* Section label */}
                {!isCollapsed && (
                  <div className="px-2 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                      {section.label}
                    </span>
                  </div>
                )}

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.name}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-all duration-200',
                                isActive
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-accent'
                              )}
                            >
                              <item.icon className="h-4.5 w-4.5" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            <div className="flex flex-col gap-0.5">
                              <span>{item.name}</span>
                              <span className="text-xs text-muted-foreground">{item.description}</span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-accent'
                        )}
                      >
                        {/* Active left bar */}
                        {isActive && (
                          <span className="absolute left-0 inset-y-2 w-[3px] rounded-r-full bg-primary-foreground/60" />
                        )}

                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium leading-tight">{item.name}</div>
                          <div
                            className={cn(
                              'text-[11px] truncate transition-colors leading-tight mt-0.5',
                              isActive
                                ? 'text-primary-foreground/75'
                                : 'text-muted-foreground/70 group-hover:text-muted-foreground'
                            )}
                          >
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* ── Footer / Profile ───────────────────────────────── */}
        <div className="shrink-0 border-t border-sidebar-border p-3 space-y-1">
          {/* Settings */}
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/settings"
                    className="flex h-10 w-10 items-center justify-center rounded-lg mx-auto text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-all duration-200"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-lg mx-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              {/* User profile strip */}
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-all duration-200 group"
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-sidebar-foreground truncate">{user?.name ?? 'My Account'}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{user?.email ?? ''}</div>
                </div>
              </Link>

              <div className="flex gap-1 px-1">
                <Link
                  href="/settings"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-all duration-200"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
