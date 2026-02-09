import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  UserPlus, 
  LogIn, 
  Gift, 
  Flame, 
  CheckCircle, 
  Plus, 
  Wallet, 
  CreditCard, 
  Bell,
  Settings 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityToggle {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const ACTIVITY_TOGGLES: ActivityToggle[] = [
  { key: "activity_feed_signups", label: "New user signups", icon: <UserPlus className="h-4 w-4" />, color: "text-green-500" },
  { key: "activity_feed_logins", label: "User logins", icon: <LogIn className="h-4 w-4" />, color: "text-blue-400" },
  { key: "activity_feed_promocode_redeemed", label: "Promocode redeemed", icon: <Gift className="h-4 w-4" />, color: "text-purple-500" },
  { key: "activity_feed_promocode_added", label: "New promocode added", icon: <Flame className="h-4 w-4" />, color: "text-orange-500" },
  { key: "activity_feed_offer_completed", label: "Offer/Survey completed", icon: <CheckCircle className="h-4 w-4" />, color: "text-blue-500" },
  { key: "activity_feed_offer_added", label: "New offers added", icon: <Plus className="h-4 w-4" />, color: "text-cyan-500" },
  { key: "activity_feed_payment_requested", label: "Payment requested", icon: <Wallet className="h-4 w-4" />, color: "text-amber-500" },
  { key: "activity_feed_payment_completed", label: "Payment completed", icon: <CreditCard className="h-4 w-4" />, color: "text-green-500" },
  { key: "activity_feed_notifications", label: "Global notifications", icon: <Bell className="h-4 w-4" />, color: "text-indigo-500" },
];

export default function ActivityFeedToggles() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ACTIVITY_TOGGLES.map(t => t.key));

    if (data) {
      const settingsMap: Record<string, boolean> = {};
      data.forEach(item => {
        settingsMap[item.key] = item.value === "true";
      });
      // Default to true for any missing settings
      ACTIVITY_TOGGLES.forEach(toggle => {
        if (settingsMap[toggle.key] === undefined) {
          settingsMap[toggle.key] = true;
        }
      });
      setSettings(settingsMap);
    }
    setIsLoading(false);
  };

  const toggleSetting = async (key: string, enabled: boolean) => {
    setSettings(prev => ({ ...prev, [key]: enabled }));

    const { error } = await supabase
      .from("site_settings")
      .upsert({ 
        key, 
        value: enabled ? "true" : "false",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

    if (error) {
      toast.error("Failed to update setting");
      setSettings(prev => ({ ...prev, [key]: !enabled }));
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Activity Feed Controls
        </CardTitle>
        <CardDescription className="text-xs">
          Toggle which activities appear in the feed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ACTIVITY_TOGGLES.map(toggle => (
            <div key={toggle.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={toggle.color}>{toggle.icon}</span>
                <Label htmlFor={toggle.key} className="text-sm cursor-pointer">
                  {toggle.label}
                </Label>
              </div>
              <Switch
                id={toggle.key}
                checked={settings[toggle.key] ?? true}
                onCheckedChange={(checked) => toggleSetting(toggle.key, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}