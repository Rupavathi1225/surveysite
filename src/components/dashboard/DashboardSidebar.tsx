import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Clock,
  UserCog,
  Mail,
  Users2,
  Wallet,
  ArrowRightLeft,
  ClipboardCheck,
  Trophy,
  Megaphone,
  Gift,
  Receipt,
  Medal,
  LifeBuoy,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Clock, label: "Balance History", path: "/dashboard/balance-history" },
  { icon: UserCog, label: "Update Account", path: "/dashboard/account" },
  { icon: Mail, label: "Inbox", path: "/dashboard/inbox" },
  { icon: Users2, label: "Your Affiliates", path: "/dashboard/affiliates" },
  { icon: Wallet, label: "Withdrawal", path: "/dashboard/withdraw" },
  { icon: ArrowRightLeft, label: "Convert Points", path: "/dashboard/convert" },
  { icon: ClipboardCheck, label: "Daily Surveys", path: "/dashboard/surveys" },
  { icon: Trophy, label: "Contest", path: "/dashboard/contest" },
  { icon: Megaphone, label: "News", path: "/dashboard/news" },
  { icon: Gift, label: "Promocode", path: "/dashboard/promocode" },
  { icon: Receipt, label: "Withdrawal History", path: "/dashboard/withdrawal-history" },
  { icon: Medal, label: "Leaderboard", path: "/dashboard/leaderboard" },
  { icon: LifeBuoy, label: "Support Ticket", path: "/dashboard/support" },
  { icon: MessageCircle, label: "Messages", path: "/dashboard/messages" },
];

export default function DashboardSidebar() {
  const location = useLocation();
  const { signOut, profile, isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!isCollapsed && (
            <Link to="/dashboard" className="font-bold text-xl gradient-text">
              SurveySite
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Info */}
        {!isCollapsed && profile && (
          <div className="p-4 border-b">
            <p className="font-medium truncate">{profile.username}</p>
            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Admin Link & Logout */}
        <div className="p-2 border-t space-y-1">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" className={cn("w-full justify-start gap-3", isCollapsed && "justify-center")}>
                <Shield className="h-5 w-5" />
                {!isCollapsed && <span>Admin Panel</span>}
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3", isCollapsed && "justify-center")}
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
