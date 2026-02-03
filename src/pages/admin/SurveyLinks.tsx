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
import { Link as LinkIcon, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface SurveyLink {
  id: string;
  name: string;
  payout: number;
  link: string;
  offer_id: string;
  provider_id: string;
  country: string;
  is_recommended: boolean;
  button_text: string;
  color_code: string;
  rating: number;
  content: string;
  level: number;
  status: string;
}

interface SurveyProvider {
  id: string;
  name: string;
}

export default function SurveyLinks() {
  const [links, setLinks] = useState<SurveyLink[]>([]);
  const [providers, setProviders] = useState<SurveyProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLink, setEditingLink] = useState<SurveyLink | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    payout: 0,
    link: "",
    offer_id: "",
    provider_id: "",
    country: "",
    is_recommended: false,
    button_text: "Start Survey",
    color_code: "#6366f1",
    rating: 0,
    content: "",
    level: 1,
    status: "active",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [linksRes, providersRes] = await Promise.all([
      supabase.from("survey_links").select("*").order("created_at", { ascending: false }),
      supabase.from("survey_providers").select("id, name"),
    ]);

    if (linksRes.data) setLinks(linksRes.data);
    if (providersRes.data) setProviders(providersRes.data);
    setIsLoading(false);
  };

  const handleEdit = (link: SurveyLink) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      payout: link.payout,
      link: link.link || "",
      offer_id: link.offer_id || "",
      provider_id: link.provider_id || "",
      country: link.country || "",
      is_recommended: link.is_recommended || false,
      button_text: link.button_text || "Start Survey",
      color_code: link.color_code || "#6366f1",
      rating: link.rating || 0,
      content: link.content || "",
      level: link.level || 1,
      status: link.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingLink(null);
    setFormData({
      name: "",
      payout: 0,
      link: "",
      offer_id: "",
      provider_id: "",
      country: "",
      is_recommended: false,
      button_text: "Start Survey",
      color_code: "#6366f1",
      rating: 0,
      content: "",
      level: 1,
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

    const data = {
      ...formData,
      provider_id: formData.provider_id || null,
    };

    if (editingLink) {
      const { error } = await supabase.from("survey_links").update(data).eq("id", editingLink.id);
      if (error) toast.error("Failed to update");
      else {
        toast.success("Updated!");
        setIsDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from("survey_links").insert(data);
      if (error) toast.error("Failed to create");
      else {
        toast.success("Created!");
        setIsDialogOpen(false);
        fetchData();
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this survey link?")) return;
    const { error } = await supabase.from("survey_links").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Deleted!");
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Survey Links</h1>
          <p className="text-muted-foreground">Manage individual survey links</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Links List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No survey links yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell>{link.payout} pts</TableCell>
                    <TableCell>{link.country || "All"}</TableCell>
                    <TableCell>
                      <Badge variant={link.status === "active" ? "default" : "secondary"}>
                        {link.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(link)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(link.id)}>
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
            <DialogTitle>{editingLink ? "Edit Survey Link" : "Add Survey Link"}</DialogTitle>
            <DialogDescription>Configure the survey link settings</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Payout (points)</Label>
                <Input type="number" value={formData.payout} onChange={(e) => setFormData({ ...formData, payout: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Survey Provider</Label>
                <Select value={formData.provider_id} onValueChange={(value) => setFormData({ ...formData, provider_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="All countries" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input value={formData.button_text} onChange={(e) => setFormData({ ...formData, button_text: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_recommended} onCheckedChange={(checked) => setFormData({ ...formData, is_recommended: checked })} />
              <Label>Is Recommended</Label>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingLink ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
