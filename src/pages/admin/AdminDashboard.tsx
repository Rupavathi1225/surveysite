import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, History, Coins, Wallet, UserCheck, Play, Pause } from "lucide-react";
import LiveActivityFeed from "@/components/dashboard/LiveActivityFeed";
import ActivityFeedToggles from "@/components/admin/ActivityFeedToggles";
import { toast } from "sonner";

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
  const [activityFeedEnabled, setActivityFeedEnabled] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchActivityFeedSetting();
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

  const fetchActivityFeedSetting = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "live_activity_feed_enabled")
      .single();
    
    if (data) {
      setActivityFeedEnabled(data.value === "true");
    }
    setIsLoadingSettings(false);
  };

  const toggleActivityFeed = async (enabled: boolean) => {
    setActivityFeedEnabled(enabled);
    
    const { error } = await supabase
      .from("site_settings")
      .upsert({ 
        key: "live_activity_feed_enabled", 
        value: enabled ? "true" : "false",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

    if (error) {
      toast.error("Failed to update setting");
      setActivityFeedEnabled(!enabled);
    } else {
      toast.success(`Live Activity Feed ${enabled ? "enabled" : "disabled"}`);
    }
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
        {/* Live Activity Feed with Toggle Control */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {activityFeedEnabled ? (
                    <Play className="h-5 w-5 text-green-500" />
                  ) : (
                    <Pause className="h-5 w-5 text-muted-foreground" />
                  )}
                  Live Activity Feed
                </CardTitle>
                <CardDescription>
                  {activityFeedEnabled ? "Showing real-time platform activity" : "Activity feed is paused"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="activity-toggle" className="text-sm text-muted-foreground">
                  {activityFeedEnabled ? "On" : "Off"}
                </Label>
                <Switch
                  id="activity-toggle"
                  checked={activityFeedEnabled}
                  onCheckedChange={toggleActivityFeed}
                  disabled={isLoadingSettings}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSettings ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : activityFeedEnabled ? (
              <LiveActivityFeed />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Pause className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Live Activity Feed is disabled</p>
                <p className="text-sm">Toggle the switch above to enable</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ActivityFeedToggles />
        </div>
      </div>
    </div>
  );
}