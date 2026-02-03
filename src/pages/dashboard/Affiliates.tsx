import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Affiliate {
  id: string;
  username: string;
  country: string;
  status: string;
  created_at: string;
}

export default function Affiliates() {
  const { profile } = useAuth();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code || ""}`;

  useEffect(() => {
    if (profile?.id) {
      fetchAffiliates();
    }
  }, [profile?.id]);

  const fetchAffiliates = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, country, status, created_at")
      .eq("referred_by", profile?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAffiliates(data);
    }
    setIsLoading(false);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Affiliates</h1>
        <p className="text-muted-foreground">View your referrals and earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Referrals</p>
            <p className="text-2xl font-bold">{profile?.referral_count || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Referral Earnings</p>
            <p className="text-2xl font-bold text-primary">${profile?.referral_earnings?.toFixed(2) || "0.00"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Affiliates</p>
            <p className="text-2xl font-bold text-green-500">
              {affiliates.filter((a) => a.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Your Code</p>
            <p className="text-2xl font-bold">{profile?.referral_code || "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>Share this link to earn commission from referrals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="flex-1" />
            <Button onClick={copyReferralLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Referrals
          </CardTitle>
          <CardDescription>Users who joined using your referral link</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : affiliates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm">Share your referral link to start earning</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-medium">{affiliate.username}</TableCell>
                    <TableCell>{affiliate.country || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={affiliate.status === "active" ? "default" : "secondary"}>
                        {affiliate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(affiliate.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
