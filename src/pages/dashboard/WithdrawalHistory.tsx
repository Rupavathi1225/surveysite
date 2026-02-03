import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt } from "lucide-react";
import { format } from "date-fns";

interface Withdrawal {
  id: string;
  created_at: string;
  payment_method: string;
  account_id: string;
  amount: number;
  fee: number;
  status: string;
  txn_id: string;
}

export default function WithdrawalHistory() {
  const { profile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchWithdrawals();
    }
  }, [profile?.id]);

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", profile?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWithdrawals(data);
    }
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawal History</h1>
        <p className="text-muted-foreground">Track all your payout requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>All your withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No withdrawals yet</p>
              <p className="text-sm">Your withdrawal history will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TXN ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(withdrawal.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{withdrawal.payment_method}</TableCell>
                    <TableCell className="font-medium">${withdrawal.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      ${withdrawal.fee?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {withdrawal.txn_id || "-"}
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
