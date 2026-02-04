import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Globe,
  ExternalLink,
  Link2,
  Trophy,
  History,
  Wallet,
  Users,
  Settings,
  Newspaper,
  TicketPercent,
  FileText,
  CreditCard,
  Lock,
  User,
  LogOut,
  Home,
  ChevronDown,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Globe, label: "Survey Providers", path: "/admin/survey-providers" },
  { icon: ExternalLink, label: "Single Link Providers", path: "/admin/single-link-providers" },
  { icon: Link2, label: "Survey Links", path: "/admin/survey-links" },
  { icon: Trophy, label: "Contests", path: "/admin/contests" },
  { icon: History, label: "Earning History", path: "/admin/transactions" },
  { icon: Wallet, label: "Withdrawals", path: "/admin/withdrawals" },
  { icon: Users, label: "Users", path: "/admin/users" },
];

const mastersMenuItems = [
  { icon: Newspaper, label: "News", path: "/admin/news" },
  { icon: TicketPercent, label: "Promocodes", path: "/admin/promocodes" },
  { icon: FileText, label: "Pages", path: "/admin/pages" },
  { icon: CreditCard, label: "Payment Methods", path: "/admin/payment-methods" },
];

const settingsMenuItems = [
  { icon: Lock, label: "Change Password", path: "/admin/change-password" },
  { icon: User, label: "Update Profile", path: "/admin/update-profile" },
  { icon: Settings, label: "Website Settings", path: "/admin/settings" },
];

export default function AdminTopNav() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item, onClick }: { item: typeof mainMenuItems[0]; onClick?: () => void }) => (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive(item.path)
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <Link to="/admin" className="font-bold text-xl gradient-text shrink-0">
          Admin Panel
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto">
          {mainMenuItems.slice(0, 4).map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                More
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {mainMenuItems.slice(4).map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Masters Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                Masters
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {mastersMenuItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Settings className="h-4 w-4" />
                Settings
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {settingsMenuItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right side actions */}
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              User Dashboard
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden ml-auto">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto">
            <div className="py-4 space-y-4">
              <div className="font-bold text-lg gradient-text mb-6">Admin Menu</div>
              
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">Main</p>
                {mainMenuItems.map((item) => (
                  <NavItem key={item.path} item={item} onClick={() => setMobileOpen(false)} />
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">Masters</p>
                {mastersMenuItems.map((item) => (
                  <NavItem key={item.path} item={item} onClick={() => setMobileOpen(false)} />
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">Settings</p>
                {settingsMenuItems.map((item) => (
                  <NavItem key={item.path} item={item} onClick={() => setMobileOpen(false)} />
                ))}
              </div>

              <div className="pt-4 border-t space-y-2">
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">
                    <Home className="h-4 w-4 mr-2" />
                    User Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
