import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Plus, Edit, Trash2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Promocode {
  id: string;
  code: string;
  reward: number;
  max_uses: number | null;
  current_uses: number | null;
  expires_at: string | null;
  status: string | null;
  created_at: string;
}

export default function AdminPromocodes() {
  const [promocodes, setPromocodes] = useState<Promocode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPromocode, setEditingPromocode] = useState<Promocode | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    reward: 0,
    max_uses: 100,
    expires_at: "",
    status: "active",
  });

  useEffect(() => {
    fetchPromocodes();
  }, []);

  const fetchPromocodes = async () => {
    const { data, error } = await supabase
      .from("promocodes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPromocodes(data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const payload = {
      code: formData.code.toUpperCase(),
      reward: formData.reward,
      max_uses: formData.max_uses,
      expires_at: formData.expires_at || null,
      status: formData.status,
    };

    if (editingPromocode) {
      const { error } = await supabase
        .from("promocodes")
        .update(payload)
        .eq("id", editingPromocode.id);

      if (error) toast.error("Failed to update");
      else {
        toast.success("Promocode updated!");
        setEditingPromocode(null);
        fetchPromocodes();
      }
    } else {
      const { error } = await supabase.from("promocodes").insert(payload);

      if (error) toast.error("Failed to create");
      else {
        toast.success("Promocode created!");
        setIsAddOpen(false);
        fetchPromocodes();
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("promocodes").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Promocode deleted!");
      fetchPromocodes();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const openEdit = (item: Promocode) => {
    setFormData({
      code: item.code,
      reward: item.reward,
      max_uses: item.max_uses || 100,
      expires_at: item.expires_at ? item.expires_at.split("T")[0] : "",
      status: item.status || "active",
    });
    setEditingPromocode(item);
  };

  const openAdd = () => {
    setFormData({ code: "", reward: 0, max_uses: 100, expires_at: "", status: "active" });
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promocodes</h1>
          <p className="text-muted-foreground">Manage promotional codes</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Promocode
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            All Promocodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : promocodes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No promocodes found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promocodes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-secondary px-2 py-1 rounded font-mono">{item.code}</code>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyCode(item.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-primary">{item.reward} pts</TableCell>
                    <TableCell>{item.current_uses || 0} / {item.max_uses || "∞"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.expires_at ? format(new Date(item.expires_at), "MMM dd, yyyy") : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen || !!editingPromocode} onOpenChange={() => { setIsAddOpen(false); setEditingPromocode(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPromocode ? "Edit Promocode" : "Add Promocode"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reward (points)</Label>
                <Input
                  type="number"
                  value={formData.reward}
                  onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
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
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingPromocode(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
