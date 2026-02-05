import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Trash2, Loader2, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Subadmin {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

interface User {
  id: string;
  user_id: string;
  username: string;
  email: string;
}

export default function AdminSubadmins() {
  const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    fetchSubadmins();
    fetchAllUsers();
  }, []);

  const fetchSubadmins = async () => {
    const { data: rolesData, error } = await supabase
      .from("user_roles")
      .select("*")
      .in("role", ["subadmin", "admin"])
      .order("created_at", { ascending: false });

    if (!error && rolesData) {
      // Fetch profiles for these users
      const userIds = rolesData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, email, first_name, last_name")
        .in("user_id", userIds);

      const enrichedData = rolesData.map(role => ({
        ...role,
        profile: profiles?.find(p => p.user_id === role.user_id),
      }));

      setSubadmins(enrichedData);
    }
    setIsLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, username, email")
      .order("username");

    if (!error && data) {
      setAllUsers(data);
    }
  };

  const handleAddSubadmin = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsSaving(true);

    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", selectedUserId)
      .in("role", ["admin", "subadmin"])
      .single();

    if (existingRole) {
      toast.error("This user already has an admin or subadmin role");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: selectedUserId,
        role: "subadmin",
      });

    if (error) {
      toast.error("Failed to add subadmin");
    } else {
      toast.success("Subadmin added successfully!");
      setIsDialogOpen(false);
      setSelectedUserId("");
      fetchSubadmins();
    }
    setIsSaving(false);
  };

  const handleRemoveRole = async (roleId: string, roleName: string) => {
    if (roleName === "admin") {
      toast.error("Cannot remove admin role from here");
      return;
    }

    if (!confirm("Are you sure you want to remove this subadmin?")) return;

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);

    if (error) {
      toast.error("Failed to remove subadmin");
    } else {
      toast.success("Subadmin removed!");
      fetchSubadmins();
    }
  };

  const filteredUsers = allUsers.filter(
    user =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subadmins</h1>
          <p className="text-muted-foreground">Manage admin & subadmin users</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subadmin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin & Subadmin List ({subadmins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : subadmins.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No subadmins found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subadmins.map((subadmin) => (
                  <TableRow key={subadmin.id}>
                    <TableCell className="font-medium">
                      {subadmin.profile?.username || "Unknown"}
                    </TableCell>
                    <TableCell>{subadmin.profile?.email || "-"}</TableCell>
                    <TableCell>
                      {`${subadmin.profile?.first_name || ""} ${subadmin.profile?.last_name || ""}`.trim() || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subadmin.role === "admin" ? "default" : "secondary"}>
                        {subadmin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(subadmin.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {subadmin.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveRole(subadmin.id, subadmin.role)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Subadmin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Add New Subadmin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user to make subadmin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Subadmins can access the admin panel and manage certain sections.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubadmin} disabled={isSaving || !selectedUserId}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Subadmin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
