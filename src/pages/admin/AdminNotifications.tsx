import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_global: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  email: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    title: "",
    message: "",
    type: "info",
    is_global: false,
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email")
      .order("username");

    if (!error && data) {
      setUsers(data);
    }
  };

  const handleCreate = () => {
    setFormData({
      user_id: "",
      title: "",
      message: "",
      type: "info",
      is_global: false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (!formData.is_global && !formData.user_id) {
      toast.error("Select a user or make it global");
      return;
    }

    setIsSaving(true);

    const insertData = {
      title: formData.title,
      message: formData.message,
      type: formData.type,
      is_global: formData.is_global,
      user_id: formData.is_global ? null : formData.user_id,
    };

    const { error } = await supabase.from("notifications").insert(insertData);

    if (error) {
      toast.error("Failed to create notification");
    } else {
      toast.success("Notification sent!");
      setIsDialogOpen(false);
      fetchNotifications();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification?")) return;

    const { error } = await supabase.from("notifications").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted!");
      fetchNotifications();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "default";
      case "warning": return "secondary";
      case "error": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Send notifications to users</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Sent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell className="font-medium">{notif.title}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(notif.type)}>{notif.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {notif.is_global ? (
                        <Badge variant="outline">Global</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {users.find((u) => u.id === notif.user_id)?.username || "User"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(notif.created_at), "PP")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(notif.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_global}
                onCheckedChange={(checked) => setFormData({ ...formData, is_global: checked })}
              />
              <Label>Send to all users (Global)</Label>
            </div>
            {!formData.is_global && (
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Notification message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
