import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Plus, Edit, Trash2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SingleLinkProvider = any;

export default function SingleLinkProviders() {
  const [providers, setProviders] = useState<SingleLinkProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SingleLinkProvider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    point_percentage: 100,
    is_recommended: false,
    rating: 0,
    button_text: "Start Survey",
    color_code: "#6366f1",
    content: "",
    postback_keys: {
      username_key: "user_id",
      status_key: "status",
      payout_key: "payout",
      txn_id_key: "txn_id",
      success_value: "1",
      failed_value: "0",
    },
    payout_type: "points",
    status: "active",
    level: 1,
  });

  const basePostbackUrl = `${window.location.origin}/api/postback`;

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    const { data, error } = await supabase
      .from("survey_providers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProviders(data);
    }
    setIsLoading(false);
  };

  const handleEdit = (provider: SingleLinkProvider) => {
    setEditingProvider(provider);
    const keys = provider.postback_keys as Record<string, string> | null;
    setFormData({
      name: provider.name,
      code: provider.code,
      point_percentage: provider.point_percentage || 100,
      is_recommended: provider.is_recommended || false,
      rating: provider.rating || 0,
      button_text: provider.button_text || "Start Survey",
      color_code: provider.color_code || "#6366f1",
      content: provider.content || "",
      postback_keys: {
        username_key: keys?.username_key || "user_id",
        status_key: keys?.status_key || "status",
        payout_key: keys?.payout_key || "payout",
        txn_id_key: keys?.txn_id_key || "txn_id",
        success_value: keys?.success_value || "1",
        failed_value: keys?.failed_value || "0",
      },
      payout_type: provider.payout_type || "points",
      status: provider.status || "active",
      level: provider.level || 1,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProvider(null);
    setFormData({
      name: "",
      code: "",
      point_percentage: 100,
      is_recommended: false,
      rating: 0,
      button_text: "Start Survey",
      color_code: "#6366f1",
      content: "",
      postback_keys: {
        username_key: "user_id",
        status_key: "status",
        payout_key: "payout",
        txn_id_key: "txn_id",
        success_value: "1",
        failed_value: "0",
      },
      payout_type: "points",
      status: "active",
      level: 1,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Name and code are required");
      return;
    }

    setIsSaving(true);

    const saveData = {
      ...formData,
      postback_url: `${basePostbackUrl}/${formData.code}`,
    };

    if (editingProvider) {
      const { error } = await supabase
        .from("survey_providers")
        .update(saveData)
        .eq("id", editingProvider.id);

      if (error) {
        toast.error("Failed to update provider");
      } else {
        toast.success("Provider updated!");
        setIsDialogOpen(false);
        fetchProviders();
      }
    } else {
      const { error } = await supabase.from("survey_providers").insert(saveData);

      if (error) {
        toast.error("Failed to create provider");
      } else {
        toast.success("Provider created!");
        setIsDialogOpen(false);
        fetchProviders();
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) return;

    const { error } = await supabase.from("survey_providers").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete provider");
    } else {
      toast.success("Provider deleted!");
      fetchProviders();
    }
  };

  const copyPostbackUrl = (code: string) => {
    navigator.clipboard.writeText(`${basePostbackUrl}/${code}`);
    toast.success("Postback URL copied!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Single Link Providers</h1>
          <p className="text-muted-foreground">Manage single link survey providers with postback</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Provider List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ExternalLink className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No providers yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-mono text-xs">{provider.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell className="font-mono">{provider.code}</TableCell>
                    <TableCell>
                      <Badge variant={provider.status === "active" ? "default" : "secondary"}>
                        {provider.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => copyPostbackUrl(provider.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(provider)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(provider.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Edit Single Link Provider" : "Add Single Link Provider"}</DialogTitle>
            <DialogDescription>Configure the single link provider with postback settings</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Provider name"
                />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="unique_code"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Point Percentage (%)</Label>
                <Input
                  type="number"
                  value={formData.point_percentage}
                  onChange={(e) => setFormData({ ...formData, point_percentage: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payout Type</Label>
                <Select
                  value={formData.payout_type}
                  onValueChange={(value) => setFormData({ ...formData, payout_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="usd">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Postback URL (Auto-generated)</Label>
              <div className="flex gap-2">
                <Input value={`${basePostbackUrl}/${formData.code || "[code]"}`} readOnly className="bg-muted" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyPostbackUrl(formData.code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <Label className="text-base font-semibold">Postback Keys</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Username Key</Label>
                  <Input
                    value={formData.postback_keys.username_key}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postback_keys: { ...formData.postback_keys, username_key: e.target.value },
                      })
                    }
                    placeholder="user_id"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Status Key</Label>
                  <Input
                    value={formData.postback_keys.status_key}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postback_keys: { ...formData.postback_keys, status_key: e.target.value },
                      })
                    }
                    placeholder="status"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Payout Key</Label>
                  <Input
                    value={formData.postback_keys.payout_key}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postback_keys: { ...formData.postback_keys, payout_key: e.target.value },
                      })
                    }
                    placeholder="payout"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Transaction ID Key</Label>
                  <Input
                    value={formData.postback_keys.txn_id_key}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postback_keys: { ...formData.postback_keys, txn_id_key: e.target.value },
                      })
                    }
                    placeholder="txn_id"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Success Value</Label>
                  <Input
                    value={formData.postback_keys.success_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postback_keys: { ...formData.postback_keys, success_value: e.target.value },
                      })
                    }
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Failed Value</Label>
                  <Input
                    value={formData.postback_keys.failed_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postback_keys: { ...formData.postback_keys, failed_value: e.target.value },
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Level</Label>
                <Input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_recommended}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recommended: checked })}
              />
              <Label>Is Recommended</Label>
            </div>

            <div className="space-y-2">
              <Label>Content / Description</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Provider description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingProvider ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
