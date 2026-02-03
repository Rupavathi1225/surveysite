import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Edit, Loader2, Globe, Mail, DollarSign, FileImage } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
}

const DEFAULT_SETTINGS = [
  { key: "site_name", label: "Site Name", type: "text", category: "general" },
  { key: "site_logo", label: "Logo URL", type: "text", category: "general" },
  { key: "site_favicon", label: "Favicon URL", type: "text", category: "general" },
  { key: "contact_email", label: "Contact Email", type: "email", category: "general" },
  { key: "homepage_text", label: "Homepage Text", type: "textarea", category: "general" },
  { key: "min_withdrawal", label: "Minimum Withdrawal ($)", type: "number", category: "payment" },
  { key: "withdrawal_fee", label: "Withdrawal Fee (%)", type: "number", category: "payment" },
  { key: "points_per_dollar", label: "Points Per Dollar", type: "number", category: "payment" },
  { key: "smtp_host", label: "SMTP Host", type: "text", category: "email" },
  { key: "smtp_port", label: "SMTP Port", type: "text", category: "email" },
  { key: "smtp_user", label: "SMTP User", type: "text", category: "email" },
  { key: "smtp_password", label: "SMTP Password", type: "password", category: "email" },
  { key: "smtp_from", label: "From Email", type: "email", category: "email" },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("key");

    if (!error && data) {
      setSettings(data);
    }
    setIsLoading(false);
  };

  const getSettingValue = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value || "";
  };

  const getSettingId = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.id;
  };

  const handleEditClick = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    if (setting) {
      setEditingSetting(setting);
      setEditValue(setting.value || "");
    } else {
      setEditingSetting({ id: "", key, value: "" });
      setEditValue("");
    }
  };

  const handleSave = async () => {
    if (!editingSetting) return;
    setIsSaving(true);

    if (editingSetting.id) {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: editValue })
        .eq("id", editingSetting.id);

      if (error) {
        toast.error("Failed to save");
      } else {
        toast.success("Setting saved!");
        setEditingSetting(null);
        fetchSettings();
      }
    } else {
      const { error } = await supabase
        .from("site_settings")
        .insert({ key: editingSetting.key, value: editValue });

      if (error) {
        toast.error("Failed to save");
      } else {
        toast.success("Setting saved!");
        setEditingSetting(null);
        fetchSettings();
      }
    }
    setIsSaving(false);
  };

  const renderSettingRow = (setting: typeof DEFAULT_SETTINGS[0]) => {
    const value = getSettingValue(setting.key);
    return (
      <TableRow key={setting.key}>
        <TableCell className="font-medium">{setting.label}</TableCell>
        <TableCell className="font-mono text-sm text-muted-foreground">
          {setting.type === "password" && value ? "••••••••" : value || "-"}
        </TableCell>
        <TableCell>
          <Button size="sm" variant="ghost" onClick={() => handleEditClick(setting.key)}>
            <Edit className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Website Settings</h1>
        <p className="text-muted-foreground">Configure global website settings</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email (SMTP)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Site name, logo, and branding</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setting</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEFAULT_SETTINGS.filter((s) => s.category === "general").map(renderSettingRow)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
                <CardDescription>Withdrawal limits and fees</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setting</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEFAULT_SETTINGS.filter((s) => s.category === "payment").map(renderSettingRow)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>SMTP settings for sending emails</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setting</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEFAULT_SETTINGS.filter((s) => s.category === "email").map(renderSettingRow)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSetting} onOpenChange={() => setEditingSetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit: {DEFAULT_SETTINGS.find((s) => s.key === editingSetting?.key)?.label || editingSetting?.key}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Value</Label>
              {DEFAULT_SETTINGS.find((s) => s.key === editingSetting?.key)?.type === "textarea" ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={4}
                />
              ) : (
                <Input
                  type={DEFAULT_SETTINGS.find((s) => s.key === editingSetting?.key)?.type || "text"}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSetting(null)}>
              Cancel
            </Button>
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
