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
import { CreditCard, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PaymentMethod {
  id: string;
  name: string;
  minimum_amount: number;
  fee_percentage: number;
  status: string;
  created_at: string;
}

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    minimum_amount: 4,
    fee_percentage: 2,
    status: "active",
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMethods(data);
    }
    setIsLoading(false);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      minimum_amount: method.minimum_amount || 4,
      fee_percentage: method.fee_percentage || 2,
      status: method.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingMethod(null);
    setFormData({
      name: "",
      minimum_amount: 4,
      fee_percentage: 2,
      status: "active",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);

    if (editingMethod) {
      const { error } = await supabase
        .from("payment_methods")
        .update(formData)
        .eq("id", editingMethod.id);

      if (error) {
        toast.error("Failed to update payment method");
      } else {
        toast.success("Payment method updated!");
        setIsDialogOpen(false);
        fetchMethods();
      }
    } else {
      const { error } = await supabase.from("payment_methods").insert(formData);

      if (error) {
        toast.error("Failed to create payment method");
      } else {
        toast.success("Payment method created!");
        setIsDialogOpen(false);
        fetchMethods();
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;

    const { error } = await supabase.from("payment_methods").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete payment method");
    } else {
      toast.success("Payment method deleted!");
      fetchMethods();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">Manage withdrawal payment methods</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No payment methods yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Minimum Amount</TableHead>
                  <TableHead>Fee %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-mono text-xs">{method.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>${method.minimum_amount}</TableCell>
                    <TableCell>{method.fee_percentage}%</TableCell>
                    <TableCell>
                      <Badge variant={method.status === "active" ? "default" : "secondary"}>
                        {method.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(method)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(method.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMethod ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
            <DialogDescription>Configure the payment method settings</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., UPI, PayPal, Bank Transfer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.minimum_amount}
                  onChange={(e) => setFormData({ ...formData, minimum_amount: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fee Percentage (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.fee_percentage}
                  onChange={(e) => setFormData({ ...formData, fee_percentage: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingMethod ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
