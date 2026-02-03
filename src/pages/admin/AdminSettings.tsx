import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  minimum_amount: number;
  fee_percentage: number;
  status: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [settingsRes, paymentsRes] = await Promise.all([
      supabase.from("site_settings").select("*").order("key"),
      supabase.from("payment_methods").select("*").order("name"),
    ]);

    if (settingsRes.data) setSettings(settingsRes.data);
    if (paymentsRes.data) setPaymentMethods(paymentsRes.data);
    setIsLoading(false);
  };

  const handleSaveSetting = async () => {
    if (!editingSetting) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("site_settings")
      .update({ value: editingSetting.value })
      .eq("id", editingSetting.id);

    if (error) toast.error("Failed to save");
    else {
      toast.success("Setting saved!");
      setEditingSetting(null);
      fetchData();
    }
    setIsSaving(false);
  };

  const handleSavePayment = async () => {
    if (!editingPayment) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("payment_methods")
      .update({
        minimum_amount: editingPayment.minimum_amount,
        fee_percentage: editingPayment.fee_percentage,
        status: editingPayment.status,
      })
      .eq("id", editingPayment.id);

    if (error) toast.error("Failed to save");
    else {
      toast.success("Payment method saved!");
      setEditingPayment(null);
      fetchData();
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground">Manage website configuration</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No settings configured</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell className="font-mono">{setting.key}</TableCell>
                        <TableCell className="max-w-xs truncate">{setting.value || "-"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setEditingSetting(setting)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Fee %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>${method.minimum_amount}</TableCell>
                      <TableCell>{method.fee_percentage}%</TableCell>
                      <TableCell>
                        <Badge variant={method.status === "active" ? "default" : "secondary"}>
                          {method.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setEditingPayment(method)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Setting Dialog */}
      <Dialog open={!!editingSetting} onOpenChange={() => setEditingSetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting: {editingSetting?.key}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                value={editingSetting?.value || ""}
                onChange={(e) =>
                  setEditingSetting(editingSetting ? { ...editingSetting, value: e.target.value } : null)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSetting(null)}>Cancel</Button>
            <Button onClick={handleSaveSetting} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={() => setEditingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit: {editingPayment?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Amount ($)</Label>
                <Input
                  type="number"
                  value={editingPayment?.minimum_amount || 0}
                  onChange={(e) =>
                    setEditingPayment(
                      editingPayment ? { ...editingPayment, minimum_amount: parseFloat(e.target.value) } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fee (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingPayment?.fee_percentage || 0}
                  onChange={(e) =>
                    setEditingPayment(
                      editingPayment ? { ...editingPayment, fee_percentage: parseFloat(e.target.value) } : null
                    )
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editingPayment?.status || "active"}
                onValueChange={(value) =>
                  setEditingPayment(editingPayment ? { ...editingPayment, status: value } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayment(null)}>Cancel</Button>
            <Button onClick={handleSavePayment} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
