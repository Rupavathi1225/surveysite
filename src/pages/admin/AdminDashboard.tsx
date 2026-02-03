import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, History, Coins, Wallet, UserCheck } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalEarningHistory: number;
  totalPointsEarned: number;
  totalWithdrawals: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [usersRes, earningRes, withdrawalsRes, activeRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("earning_history").select("amount"),
      supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "success"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    const totalPoints = earningRes.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

    setStats({
      totalUsers: usersRes.count || 0,
      totalEarningHistory: earningRes.data?.length || 0,
      totalPointsEarned: totalPoints,
      totalWithdrawals: withdrawalsRes.count || 0,
      activeUsers: activeRes.count || 0,
    });
    setIsLoading(false);
  };

  const statCards = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers || 0, color: "text-blue-500" },
    { icon: History, label: "Total Transactions", value: stats?.totalEarningHistory || 0, color: "text-purple-500" },
    { icon: Coins, label: "Total Points Earned", value: stats?.totalPointsEarned || 0, color: "text-primary" },
    { icon: Wallet, label: "Total Withdrawals", value: stats?.totalWithdrawals || 0, color: "text-green-500" },
    { icon: UserCheck, label: "Active Users", value: stats?.activeUsers || 0, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and statistics</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-secondary ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Activity feed will appear here
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-center py-8">
              Quick action buttons will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
