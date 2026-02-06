import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Promocode {
  id: string;
  code: string;
  reward: number;
  status: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
}

export default function Promocode() {
  const { profile, refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentCodes, setRecentCodes] = useState<{ code: string; reward: number; date: string }[]>([]);

  useEffect(() => {
    if (profile?.id) {
      fetchUsedCodes();
    }
  }, [profile?.id]);

  const fetchUsedCodes = async () => {
    const { data } = await supabase
      .from("promocode_uses")
      .select("created_at, promocode:promocodes(code, reward)")
      .eq("user_id", profile?.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setRecentCodes(
        data.map((item: any) => ({
          code: item.promocode?.code || "Unknown",
          reward: item.promocode?.reward || 0,
          date: item.created_at,
        }))
      );
    }
  };

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error("Please enter a promocode");
      return;
    }

    if (!profile?.id) {
      toast.error("Please login to continue");
      return;
    }

    setIsLoading(true);

    // Find the promocode
    const { data: promocode, error: findError } = await supabase
      .from("promocodes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("status", "active")
      .single();

    if (findError || !promocode) {
      toast.error("Invalid or expired promocode");
      setIsLoading(false);
      return;
    }

    // Check if already used
    const { data: existingUse } = await supabase
      .from("promocode_uses")
      .select("id")
      .eq("user_id", profile.id)
      .eq("promocode_id", promocode.id)
      .single();

    if (existingUse) {
      toast.error("You've already used this promocode");
      setIsLoading(false);
      return;
    }

    // Check max uses
    if (promocode.max_uses && promocode.current_uses >= promocode.max_uses) {
      toast.error("This promocode has reached its usage limit");
      setIsLoading(false);
      return;
    }

    // Check expiration
    if (promocode.expires_at && new Date(promocode.expires_at) < new Date()) {
      toast.error("This promocode has expired");
      setIsLoading(false);
      return;
    }

    // Use RPC function to update points, earning history, and promocode usage
    // Pass all parameters to avoid function overload ambiguity
    const { data: redeemResult, error: redeemError } = await supabase.rpc("redeem_promocode", {
      p_user_id: profile.id,
      p_promocode_id: promocode.id,
      p_reward: promocode.reward,
      p_code: promocode.code,
      p_is_gift_card: promocode.is_gift_card || false,
      p_credit_amount: promocode.credit_amount || 0,
    });

    if (redeemError) {
      console.error("Redeem error:", redeemError);
      toast.error("Failed to redeem promocode");
      setIsLoading(false);
      return;
    }

    toast.success(`Congratulations! You earned ${promocode.reward} points!`);
    setCode("");
    await refreshProfile();
    await fetchUsedCodes();
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Promocode</h1>
        <p className="text-muted-foreground">Redeem promo codes for bonus points</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Enter Promocode
          </CardTitle>
          <CardDescription>Have a promocode? Enter it below to claim your reward</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter promocode"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 uppercase"
            />
            <Button onClick={handleRedeem} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Redeem
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Redeemed</CardTitle>
          <CardDescription>Your recently used promocodes</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No promocodes redeemed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCodes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-medium">{item.code}</span>
                  </div>
                  <Badge variant="secondary">+{item.reward} pts</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
