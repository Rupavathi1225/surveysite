import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, CheckCircle, XCircle, Eye, AlertTriangle, Pause, Clock, Gift } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  payment_method: string;
  account_id: string;
  status: string;
  txn_id: string;
  admin_note: string;
  created_at: string;
  approved_at: string | null;
  updated_at: string;
  profiles?: { username: string; email: string; promocode_count?: number };
}

interface UserStats {
  promocodes_redeemed: number;
  total_points_earned: number;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [txnId, setTxnId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*, profiles(username, email)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWithdrawals(data);
    }
    setIsLoading(false);
  };

  const fetchUserStats = async (userId: string) => {
    const { data: promoData } = await supabase
      .from("promocode_uses")
      .select("id")
      .eq("user_id", userId);

    const { data: earningData } = await supabase
      .from("earning_history")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "promocode");

    const totalPoints = earningData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

    setUserStats({
      promocodes_redeemed: promoData?.length || 0,
      total_points_earned: totalPoints,
    });
  };

  const handleStatusUpdate = async (id: string, status: string, note?: string) => {
    const updateData: Record<string, unknown> = { 
      status, 
      admin_note: note || adminNote,
      updated_at: new Date().toISOString()
    };
    
    if (status === "success") {
      updateData.txn_id = txnId;
      updateData.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("withdrawals")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error(`Failed to update status`);
    } else {
      toast.success(`Withdrawal marked as ${status}!`);
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one withdrawal");
      return;
    }
    if (!bulkAction) {
      toast.error("Please select an action");
      return;
    }

    const updateData: Record<string, unknown> = { 
      status: bulkAction,
      updated_at: new Date().toISOString()
    };
    
    if (bulkAction === "success") {
      updateData.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("withdrawals")
      .update(updateData)
      .in("id", selectedIds);

    if (error) {
      toast.error("Failed to update withdrawals");
    } else {
      toast.success(`${selectedIds.length} withdrawals marked as ${bulkAction}!`);
      setSelectedIds([]);
      setBulkAction("");
      fetchWithdrawals();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendingIds = withdrawals.filter(w => w.status === "pending").map(w => w.id);
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case "suspicious":
        return <Badge className="bg-red-600">Suspicious</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <p className="text-muted-foreground">Manage withdrawal requests</p>
      </div>

      {/* Bulk Actions */}
      {pendingWithdrawals.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedIds.length === pendingWithdrawals.length && pendingWithdrawals.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm">
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all pending"}
                </span>
              </div>
              {selectedIds.length > 0 && (
                <>
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Bulk action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Approve
                        </div>
                      </SelectItem>
                      <SelectItem value="paused">
                        <div className="flex items-center gap-2">
                          <Pause className="h-4 w-4 text-yellow-500" />
                          Pause
                        </div>
                      </SelectItem>
                      <SelectItem value="suspicious">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Suspicious
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          Reject
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleBulkAction} size="sm">
                    Apply to {selectedIds.length}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Withdrawal Requests
          </CardTitle>
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
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No withdrawal requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      {withdrawal.status === "pending" && (
                        <Checkbox 
                          checked={selectedIds.includes(withdrawal.id)}
                          onCheckedChange={() => toggleSelect(withdrawal.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {withdrawal.profiles?.username || "Unknown"}
                    </TableCell>
                    <TableCell>{withdrawal.payment_method}</TableCell>
                    <TableCell className="font-mono text-sm max-w-[120px] truncate">
                      {withdrawal.account_id}
                    </TableCell>
                    <TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(withdrawal.created_at), "MMM dd, HH:mm")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {withdrawal.approved_at 
                        ? format(new Date(withdrawal.approved_at), "MMM dd, HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setAdminNote(withdrawal.admin_note || "");
                            setTxnId(withdrawal.txn_id || "");
                            fetchUserStats(withdrawal.user_id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {withdrawal.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-500"
                              onClick={() => handleStatusUpdate(withdrawal.id, "success")}
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-yellow-500"
                              onClick={() => handleStatusUpdate(withdrawal.id, "paused", "Payment paused for review")}
                              title="Pause"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleStatusUpdate(withdrawal.id, "suspicious", "Flagged for suspicious activity")}
                              title="Flag Suspicious"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
            <DialogDescription>Review and process this withdrawal request</DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedWithdrawal.profiles?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">${selectedWithdrawal.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium">{selectedWithdrawal.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <p className="font-mono text-sm">{selectedWithdrawal.account_id}</p>
                </div>
              </div>

              {/* User Promocode Stats */}
              <div className="p-3 rounded-lg bg-secondary/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-sm">Promocode Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Promocodes Redeemed</p>
                    <p className="font-bold text-lg">{userStats?.promocodes_redeemed || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Points from Promocodes</p>
                    <p className="font-bold text-lg">{userStats?.total_points_earned || 0}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="p-3 rounded-lg bg-secondary/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Timeline</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requested</p>
                    <p>{format(new Date(selectedWithdrawal.created_at), "MMM dd, yyyy HH:mm")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>
                      {selectedWithdrawal.approved_at 
                        ? format(new Date(selectedWithdrawal.approved_at), "MMM dd, yyyy HH:mm")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Transaction ID</Label>
                <Input
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="Enter TXN ID after payment"
                />
              </div>
              <div className="space-y-2">
                <Label>Admin Note</Label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note..."
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleStatusUpdate(selectedWithdrawal.id, "success")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  onClick={() => handleStatusUpdate(selectedWithdrawal.id, "paused")}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleStatusUpdate(selectedWithdrawal.id, "suspicious")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Suspicious
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate(selectedWithdrawal.id, "rejected")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}