'use client';

import { useAppSelector } from "@/hooks/redux.hook";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  ArrowLeftRight,
  Activity
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAppSelector((state) => state.user);

  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      description: "+10% from last month",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Investments",
      value: "$45,231",
      description: "+5% from last month",
      icon: TrendingUp,
      color: "text-success"
    },
    {
      title: "Pending Deposits",
      value: "23",
      description: "Awaiting approval",
      icon: CreditCard,
      color: "text-warning"
    },
    {
      title: "Total Revenue",
      value: "$12,345",
      description: "+8% from last month",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Withdrawals",
      value: "12",
      description: "Pending review",
      icon: ArrowLeftRight,
      color: "text-info"
    },
    {
      title: "System Status",
      value: "Healthy",
      description: "All systems operational",
      icon: Activity,
      color: "text-success"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your investment platform today.
        </p>
        <Badge variant="outline" className="w-fit">
          Administrator Dashboard
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
              <Users className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-muted-foreground">View and edit user accounts</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
              <CreditCard className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-medium">Review Deposits</h3>
              <p className="text-sm text-muted-foreground">Approve pending deposits</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
              <TrendingUp className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-medium">Investment Plans</h3>
              <p className="text-sm text-muted-foreground">Manage investment options</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
              <ArrowLeftRight className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-medium">Process Withdrawals</h3>
              <p className="text-sm text-muted-foreground">Review withdrawal requests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "New user registration",
                user: "john.doe@example.com",
                time: "2 minutes ago",
                type: "user"
              },
              {
                action: "Deposit approved",
                user: "jane.smith@example.com",
                time: "5 minutes ago",
                type: "deposit"
              },
              {
                action: "Investment created",
                user: "bob.wilson@example.com",
                time: "10 minutes ago",
                type: "investment"
              },
              {
                action: "Withdrawal processed",
                user: "alice.brown@example.com",
                time: "15 minutes ago",
                type: "withdrawal"
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.user} • {activity.time}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
