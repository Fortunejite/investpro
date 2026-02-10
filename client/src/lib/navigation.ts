import {
  TrendingUp,
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  LineChart,
  ArrowLeftRight,
  Copy,
  BarChart3,
} from 'lucide-react';

export const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview of your portfolio',
  },
  {
    name: 'Markets',
    href: '/markets',
    icon: LineChart,
    description: 'Browse cryptocurrency markets',
  },
  {
    name: 'Trades',
    href: '/trades',
    icon: BarChart3,
    description: 'View and manage your trades',
  },
  {
    name: 'Swap',
    href: '/swap',
    icon: ArrowLeftRight,
    description: 'Exchange cryptocurrencies',
  },
  {
    name: 'Copy Trading',
    href: '/copy-trading',
    icon: Copy,
    description: 'Follow successful traders',
  },
  {
    name: 'Invest',
    href: '/investments',
    icon: TrendingUp,
    description: 'Investment opportunities',
  },
  {
    name: 'Signals',
    href: '/trading-signals',
    icon: Activity,
    description: 'Trading signals and alerts',
  },
  {
    name: 'Deposit',
    href: '/deposit',
    icon: ArrowDownToLine,
    description: 'Add funds to your account',
  },
  {
    name: 'Withdraw',
    href: '/withdrawal',
    icon: ArrowUpFromLine,
    description: 'Withdraw funds from account',
  },
];
