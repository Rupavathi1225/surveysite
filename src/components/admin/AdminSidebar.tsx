import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Globe,
  Link2,
  Trophy,
  History,
  Wallet,
  Users,
  Settings,
  Newspaper,
  TicketPercent,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Globe, label: "Survey Providers", path: "/admin/survey-providers" },
  { icon: Link2, label: "Survey Links", path: "/admin/survey-links" },
  { icon: Trophy, label: "Contests", path: "/admin/contests" },
  { icon: History, label: "Earning History", path: "/admin/transactions" },
  { icon: Wallet, label: "Withdrawals", path: "/admin/withdrawals" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Newspaper, label: "News", path: "/admin/news" },
  { icon: TicketPercent, label: "Promocodes", path: "/admin/promocodes" },
  { icon: FileText, label: "Pages", path: "/admin/pages" },
  { icon: Settings, label: "Site Settings", path: "/admin/settings" },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
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
            <Link to="/admin" className="font-bold text-xl gradient-text">
              Admin Panel
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

        {/* Back to Dashboard */}
        <div className="p-2 border-t space-y-1">
          <Link to="/dashboard">
            <Button variant="outline" className={cn("w-full justify-start gap-3", isCollapsed && "justify-center")}>
              <Home className="h-5 w-5" />
              {!isCollapsed && <span>User Dashboard</span>}
            </Button>
          </Link>
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
