import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Coins,
  Lock,
  TrendingUp,
  Users,
  DollarSign,
  Copy,
  ExternalLink,
  Star,
  Zap,
  Gift,
  CheckCircle,
  Clock,
  ClipboardList,
  ArrowLeftRight,
} from "lucide-react";
 import LiveActivityFeed from "@/components/dashboard/LiveActivityFeed";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface SurveyProvider {
  id: string;
  name: string;
  rating: number | null;
  is_recommended: boolean | null;
  image_url: string | null;
}

interface SurveyLink {
  id: string;
  name: string;
  payout: number;
  content: string | null;
  link: string | null;
}

interface EarningHistory {
  id: string;
  description: string;
  amount: number;
  created_at: string;
}
 // Note: recentEarnings state is kept for potential future use but activity feed now handles display
export default function Dashboard() {
  const { profile } = useAuth();
  const [offerwalls, setOfferwalls] = useState<SurveyProvider[]>([]);
  const [dailySurveys, setDailySurveys] = useState<SurveyLink[]>([]);
  const [recentEarnings, setRecentEarnings] = useState<EarningHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile?.id]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    // Fetch offerwalls (survey providers)
    const { data: providers } = await supabase
      .from("survey_providers")
      .select("id, name, rating, is_recommended, image_url")
      .eq("status", "active")
      .order("is_recommended", { ascending: false })
      .limit(6);

    if (providers) setOfferwalls(providers);

    // Fetch daily surveys (survey links)
    const { data: surveys } = await supabase
      .from("survey_links")
      .select("id, name, payout, content, link")
      .eq("status", "active")
      .order("is_recommended", { ascending: false })
      .limit(3);

    if (surveys) setDailySurveys(surveys);

    // Fetch recent earnings for this user
    if (profile?.id) {
      const { data: earnings } = await supabase
        .from("earning_history")
        .select("id, description, amount, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (earnings) setRecentEarnings(earnings);
    }

    setIsLoading(false);
  };

  const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code || ""}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const walletCards = [
    { icon: Wallet, label: "Cash Balance", value: `$${profile?.cash_balance?.toFixed(2) || "0.00"}`, color: "text-primary" },
    { icon: Coins, label: "Points", value: profile?.points_balance || 0, color: "text-accent" },
    { icon: Lock, label: "Locked Points", value: profile?.locked_points || 0, color: "text-muted-foreground" },
    { icon: TrendingUp, label: "Lifetime Payouts", value: `$${profile?.lifetime_payouts?.toFixed(2) || "0.00"}`, color: "text-green-500" },
    { icon: Users, label: "Referral Count", value: profile?.referral_count || 0, color: "text-blue-500" },
    { icon: DollarSign, label: "Referral Earnings", value: `$${profile?.referral_earnings?.toFixed(2) || "0.00"}`, color: "text-purple-500" },
  ];

  const quickActions = [
    { icon: ClipboardList, label: "Daily Surveys", path: "/dashboard/surveys", color: "bg-primary" },
    { icon: Gift, label: "Exclusive Offers", path: "/dashboard/surveys", color: "bg-accent" },
    { icon: Wallet, label: "Withdraw Cash", path: "/dashboard/withdraw", color: "bg-green-500" },
    { icon: ArrowLeftRight, label: "Convert Points", path: "/dashboard/convert", color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Panel */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, <span className="gradient-text">{profile?.first_name || profile?.username}</span>!
              </h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <span>Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</span>
                <Badge variant={profile?.is_verified ? "default" : "secondary"}>
                  {profile?.is_verified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Unverified
                    </>
                  )}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-primary">${profile?.cash_balance?.toFixed(2) || "0.00"}</p>
              </div>
              <Link to="/dashboard/withdraw">
                <Button>Withdraw</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refer & Earn Box */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Refer & Earn
          </CardTitle>
          <CardDescription>Share your referral link and earn points from new members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="flex-1" />
            <Button onClick={copyReferralLink} variant="secondary">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.path}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <p className="font-medium">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Wallet Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {walletCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recommended Offerwalls */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Offerwalls</CardTitle>
            <CardDescription>Complete offers to earn points</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : offerwalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No offerwalls available</p>
                <p className="text-sm">Check back later for new offers</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {offerwalls.map((wall) => (
                  <div
                    key={wall.id}
                    className="p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{wall.name}</span>
                      {wall.is_recommended && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    {wall.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-muted-foreground">{wall.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Surveys */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Surveys</CardTitle>
            <CardDescription>Complete surveys to earn quick points</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : dailySurveys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No surveys available</p>
                <p className="text-sm">Check back later for new surveys</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailySurveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div>
                      <p className="font-medium">{survey.name}</p>
                      <p className="text-sm text-muted-foreground">{survey.content || "Complete this survey to earn points"}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-primary">{survey.payout} pts</Badge>
                      {survey.link && (
                        <a href={survey.link} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="mt-1">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Credited */}
       <LiveActivityFeed />
    </div>
  );
}
