import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SurveyProvider {
  id: string;
  name: string;
  code: string;
  point_percentage: number;
  is_recommended: boolean;
  rating: number;
  button_text: string;
  color_code: string;
  content: string;
  iframe_code: string;
  payout_type: string;
  status: string;
  level: number;
}

export default function SurveyProviders() {
  const [providers, setProviders] = useState<SurveyProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SurveyProvider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    point_percentage: 100,
    is_recommended: false,
    rating: 0,
    button_text: "Open Survey",
    color_code: "#6366f1",
    content: "",
    iframe_code: "",
    payout_type: "points",
    status: "active",
    level: 1,
  });

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

  const handleEdit = (provider: SurveyProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      code: provider.code,
      point_percentage: provider.point_percentage || 100,
      is_recommended: provider.is_recommended || false,
      rating: provider.rating || 0,
      button_text: provider.button_text || "Open Survey",
      color_code: provider.color_code || "#6366f1",
      content: provider.content || "",
      iframe_code: provider.iframe_code || "",
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
      button_text: "Open Survey",
      color_code: "#6366f1",
      content: "",
      iframe_code: "",
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

    if (editingProvider) {
      const { error } = await supabase
        .from("survey_providers")
        .update(formData)
        .eq("id", editingProvider.id);

      if (error) {
        toast.error("Failed to update provider");
      } else {
        toast.success("Provider updated!");
        setIsDialogOpen(false);
        fetchProviders();
      }
    } else {
      const { error } = await supabase.from("survey_providers").insert(formData);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Survey Providers</h1>
          <p className="text-muted-foreground">Manage offerwall providers</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No providers yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Point %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell className="font-mono">{provider.code}</TableCell>
                    <TableCell>{provider.point_percentage}%</TableCell>
                    <TableCell>
                      <Badge variant={provider.status === "active" ? "default" : "secondary"}>
                        {provider.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
            <DialogTitle>{editingProvider ? "Edit Provider" : "Add Provider"}</DialogTitle>
            <DialogDescription>Configure the survey provider settings</DialogDescription>
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
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Point %</Label>
                <Input
                  type="number"
                  value={formData.point_percentage}
                  onChange={(e) => setFormData({ ...formData, point_percentage: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <Input
                  type="number"
                  step="0.1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                />
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
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color Code</Label>
                <Input
                  type="color"
                  value={formData.color_code}
                  onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_recommended}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recommended: checked })}
              />
              <Label>Is Recommended</Label>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Iframe Code</Label>
              <Textarea
                value={formData.iframe_code}
                onChange={(e) => setFormData({ ...formData, iframe_code: e.target.value })}
                placeholder="<iframe>...</iframe>"
                rows={4}
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
