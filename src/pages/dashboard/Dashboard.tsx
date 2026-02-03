import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { profile } = useAuth();

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

  const offerwalls = [
    { name: "CPX Research", rating: 4.5, payout: "High" },
    { name: "Bitlabs", rating: 4.3, payout: "Medium" },
    { name: "Monlix", rating: 4.0, payout: "High" },
    { name: "Wannads", rating: 3.8, payout: "Medium" },
    { name: "Torox", rating: 4.2, payout: "High" },
    { name: "Adgate", rating: 3.9, payout: "Medium" },
  ];

  const dailySurveys = [
    { name: "Dynata", points: 50, description: "Quick surveys with instant rewards" },
    { name: "Paneland", points: 31, description: "Daily opinion polls" },
    { name: "My Opinion", points: 40, description: "Share your thoughts and earn" },
  ];

  const recentActivity = [
    { user: "User123", action: "completed survey", points: 50, time: "2 min ago" },
    { user: "JohnDoe", action: "withdrew", points: 500, time: "5 min ago" },
    { user: "Sarah", action: "joined via referral", points: 10, time: "10 min ago" },
    { user: "Mike", action: "completed offer", points: 100, time: "15 min ago" },
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
                  <Zap className="h-6 w-6 text-white" />
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
            <div className="grid grid-cols-2 gap-3">
              {offerwalls.map((wall) => (
                <div
                  key={wall.name}
                  className="p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{wall.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {wall.payout}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-muted-foreground">{wall.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Surveys */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Surveys</CardTitle>
            <CardDescription>Complete surveys to earn quick points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailySurveys.map((survey) => (
              <div
                key={survey.name}
                className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-medium">{survey.name}</p>
                  <p className="text-sm text-muted-foreground">{survey.description}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-primary">{survey.points} pts</Badge>
                  <Button variant="ghost" size="sm" className="mt-1">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Live Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Live Activity</CardTitle>
            <CardDescription>Real-time user activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      {activity.user[0]}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline">+{activity.points}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Last Credited */}
        <Card>
          <CardHeader>
            <CardTitle>Last Credited</CardTitle>
            <CardDescription>Your recent earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent credits</p>
              <p className="text-sm">Complete surveys to start earning!</p>
              <Link to="/dashboard/surveys">
                <Button className="mt-4">
                  Start Earning <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Import missing icons
import { ClipboardList, ArrowLeftRight } from "lucide-react";
