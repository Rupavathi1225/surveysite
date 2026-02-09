import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  CheckCircle,
  Gift,
  Flame,
  Plus,
  Coins,
  Wallet,
  CreditCard,
  Activity,
  LogIn,
  Bell,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

interface LiveActivityFeedProps {
  showCard?: boolean;
}

export default function LiveActivityFeed({ showCard = false }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityToggles, setActivityToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActivities();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchActivityToggles = async (): Promise<Record<string, boolean>> => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .like("key", "activity_feed_%");

    const toggles: Record<string, boolean> = {};
    data?.forEach(item => {
      toggles[item.key] = item.value === "true";
    });
    setActivityToggles(toggles);
    return toggles;
  };

  const fetchActivities = async () => {
    setIsLoading(true);
    
    // Fetch current toggles first
    const currentToggles = await fetchActivityToggles();
    
    const allActivities: ActivityItem[] = [];

    // 0. Fetch scheduled activities that are due to be displayed
    const { data: scheduledActivities } = await supabase
      .from("scheduled_activities")
      .select("*")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: false })
      .limit(20);

    if (scheduledActivities) {
      // Mark them as displayed and add to feed
      const idsToUpdate = scheduledActivities.filter(a => !a.is_displayed).map(a => a.id);
      if (idsToUpdate.length > 0) {
        await supabase
          .from("scheduled_activities")
          .update({ is_displayed: true })
          .in("id", idsToUpdate);
      }

      scheduledActivities.forEach((activity) => {
        const iconMap: Record<string, React.ReactNode> = {
          "user-plus": <UserPlus className="h-4 w-4" />,
          "login": <LogIn className="h-4 w-4" />,
          "gift": <Gift className="h-4 w-4" />,
          "check": <CheckCircle className="h-4 w-4" />,
          "coins": <Coins className="h-4 w-4" />,
          "wallet": <Wallet className="h-4 w-4" />,
          "credit-card": <CreditCard className="h-4 w-4" />,
          "bell": <Bell className="h-4 w-4" />,
          "flame": <Flame className="h-4 w-4" />,
          "plus": <Plus className="h-4 w-4" />,
        };
        
        allActivities.push({
          id: `scheduled-${activity.id}`,
          type: activity.activity_type,
          message: activity.message,
          timestamp: activity.scheduled_at,
          icon: iconMap[activity.icon_type] || <Activity className="h-4 w-4" />,
          color: activity.icon_color || "text-green-500",
        });
      });
    }

    // 1. New User Signups (recent profiles - exclude generated users)
    const { data: newUsers } = await supabase
      .from("profiles")
      .select("id, username, first_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (newUsers) {
      newUsers.forEach((user) => {
        const displayName = user.first_name || user.username || "User";
        allActivities.push({
          id: `signup-${user.id}`,
          type: "signup",
          message: `🎉 New user ${displayName} just signed up`,
          timestamp: user.created_at,
          icon: <UserPlus className="h-4 w-4" />,
          color: "text-green-500",
        });
      });
    }

    // 2. Login Activity (recent logins)
    const { data: recentLogins } = await supabase
      .from("login_logs")
      .select("id, email, login_at, status")
      .eq("status", "success")
      .order("login_at", { ascending: false })
      .limit(5);

    if (recentLogins) {
      recentLogins.forEach((login) => {
        const userName = login.email?.split("@")[0] || "User";
        allActivities.push({
          id: `login-${login.id}`,
          type: "login",
          message: `👋 ${userName} logged in`,
          timestamp: login.login_at,
          icon: <LogIn className="h-4 w-4" />,
          color: "text-blue-400",
        });
      });
    }

    // 3. Promocode Redemptions
    const { data: promoRedemptions } = await supabase
      .from("earning_history")
      .select(`
        id, description, amount, created_at, user_id, type,
        profiles!earning_history_user_id_fkey(username, first_name)
      `)
      .eq("type", "promocode")
      .order("created_at", { ascending: false })
      .limit(10);

    if (promoRedemptions) {
      promoRedemptions.forEach((redemption: any) => {
        const userName = redemption.profiles?.first_name || redemption.profiles?.username || "User";
        allActivities.push({
          id: `promo-redeem-${redemption.id}`,
          type: "promocode_redeemed",
          message: `🎁 ${userName} redeemed promocode for ${redemption.amount} points`,
          timestamp: redemption.created_at,
          icon: <Gift className="h-4 w-4" />,
          color: "text-purple-500",
        });
      });
    }

    // 4. Offer/Survey Completions
    const { data: completedOffers } = await supabase
      .from("earning_history")
      .select(`
        id, description, amount, created_at, user_id, type,
        profiles!earning_history_user_id_fkey(username, first_name)
      `)
      .in("type", ["survey", "offer"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (completedOffers) {
      completedOffers.forEach((offer: any) => {
        const userName = offer.profiles?.first_name || offer.profiles?.username || "User";
        allActivities.push({
          id: `offer-${offer.id}`,
          type: "offer_completed",
          message: `✅ ${userName} completed ${offer.description} (+${offer.amount} pts)`,
          timestamp: offer.created_at,
          icon: <CheckCircle className="h-4 w-4" />,
          color: "text-blue-500",
        });
      });
    }

    // 5. Referral Credits
    const { data: referralCredits } = await supabase
      .from("earning_history")
      .select(`
        id, description, amount, created_at, user_id, type,
        profiles!earning_history_user_id_fkey(username, first_name)
      `)
      .eq("type", "referral")
      .order("created_at", { ascending: false })
      .limit(5);

    if (referralCredits) {
      referralCredits.forEach((credit: any) => {
        const userName = credit.profiles?.first_name || credit.profiles?.username || "User";
        allActivities.push({
          id: `referral-${credit.id}`,
          type: "credits",
          message: `💰 ${credit.amount} referral points added to ${userName}'s account`,
          timestamp: credit.created_at,
          icon: <Coins className="h-4 w-4" />,
          color: "text-yellow-500",
        });
      });
    }

    // 6. New Promocodes Added
    const { data: newPromocodes } = await supabase
      .from("promocodes")
      .select("id, code, name, reward, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (newPromocodes) {
      newPromocodes.forEach((promo) => {
        allActivities.push({
          id: `promo-added-${promo.id}`,
          type: "promocode_added",
          message: `🔥 New promocode ${promo.code} is now live (${promo.reward} pts)`,
          timestamp: promo.created_at,
          icon: <Flame className="h-4 w-4" />,
          color: "text-orange-500",
        });
      });
    }

    // 7. New Offers/Surveys Added
    const { data: newOffers } = await supabase
      .from("survey_links")
      .select("id, name, payout, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (newOffers) {
      newOffers.forEach((offer) => {
        allActivities.push({
          id: `offer-added-${offer.id}`,
          type: "offer_added",
          message: `🆕 New offer ${offer.name} added (${offer.payout} pts)`,
          timestamp: offer.created_at,
          icon: <Plus className="h-4 w-4" />,
          color: "text-cyan-500",
        });
      });
    }

    // 8. Global Notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("id, title, message, created_at, type")
      .eq("is_global", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (notifications) {
      notifications.forEach((notif) => {
        allActivities.push({
          id: `notif-${notif.id}`,
          type: "notification",
          message: `📢 ${notif.title}`,
          timestamp: notif.created_at,
          icon: <Bell className="h-4 w-4" />,
          color: "text-indigo-500",
        });
      });
    }

    // 9. Payment Requests
    const { data: pendingWithdrawals } = await supabase
      .from("withdrawals")
      .select(`
        id, amount, status, created_at,
        profiles!withdrawals_user_id_fkey(username, first_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    if (pendingWithdrawals) {
      pendingWithdrawals.forEach((withdrawal: any) => {
        const userName = withdrawal.profiles?.first_name || withdrawal.profiles?.username || "User";
        allActivities.push({
          id: `payment-req-${withdrawal.id}`,
          type: "payment_requested",
          message: `💸 ${userName} requested payment of ₹${withdrawal.amount}`,
          timestamp: withdrawal.created_at,
          icon: <Wallet className="h-4 w-4" />,
          color: "text-amber-500",
        });
      });
    }

    // 10. Completed Payments
    const { data: completedWithdrawals } = await supabase
      .from("withdrawals")
      .select(`
        id, amount, status, updated_at,
        profiles!withdrawals_user_id_fkey(username, first_name)
      `)
      .eq("status", "success")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (completedWithdrawals) {
      completedWithdrawals.forEach((withdrawal: any) => {
        const userName = withdrawal.profiles?.first_name || withdrawal.profiles?.username || "User";
        allActivities.push({
          id: `payment-done-${withdrawal.id}`,
          type: "payment_completed",
          message: `✅ Payment of ₹${withdrawal.amount} successfully sent to ${userName}`,
          timestamp: withdrawal.updated_at,
          icon: <CreditCard className="h-4 w-4" />,
          color: "text-green-500",
        });
      });
    }

    // Sort all activities by timestamp (newest first)
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter based on activity toggles
    const filteredActivities = allActivities.filter(activity => {
      const toggleMap: Record<string, string> = {
        signup: "activity_feed_signups",
        login: "activity_feed_logins",
        promocode_redeemed: "activity_feed_promocode_redeemed",
        promocode_added: "activity_feed_promocode_added",
        offer_completed: "activity_feed_offer_completed",
        offer_added: "activity_feed_offer_added",
        payment_requested: "activity_feed_payment_requested",
        payment_completed: "activity_feed_payment_completed",
        notification: "activity_feed_notifications",
        credits: "activity_feed_promocode_redeemed", // referral credits follow promocode toggle
      };
      
      const toggleKey = toggleMap[activity.type];
      // Default to true if toggle not found, but respect explicit false values
      if (!toggleKey) return true;
      return currentToggles[toggleKey] !== false;
    });

    // Take the most recent 20 activities
    setActivities(filteredActivities.slice(0, 20));
    setIsLoading(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const content = isLoading ? (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  ) : activities.length === 0 ? (
    <div className="text-center py-8 text-muted-foreground">
      <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>No recent activity</p>
      <p className="text-sm">Activity will appear here as it happens</p>
    </div>
  ) : (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className={`mt-0.5 ${activity.color}`}>
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed">{activity.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Live Activity Feed
        </CardTitle>
        <CardDescription>Real-time platform activity</CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}