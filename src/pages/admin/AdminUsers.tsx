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
import { Users, Plus, Edit, Trash2, Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string;
  country: string;
  points_balance: number;
  cash_balance: number;
  status: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    country: "India",
    points_balance: 0,
    cash_balance: 0,
    status: "active",
  });

  const [addFormData, setAddFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    mobile: "",
    country: "India",
    status: "active",
  });

  const [bulkFormData, setBulkFormData] = useState({
    base_username: "",
    password: "",
    country: "India",
    count: 1,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
      setFilteredUsers(data);
    }
    setIsLoading(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      mobile: user.mobile || "",
      country: user.country || "India",
      points_balance: user.points_balance || 0,
      cash_balance: user.cash_balance || 0,
      status: user.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", editingUser.id);

    if (error) {
      toast.error("Failed to update user");
    } else {
      toast.success("User updated!");
      setIsDialogOpen(false);
      fetchUsers();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete user");
    } else {
      toast.success("User deleted!");
      fetchUsers();
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkFormData.base_username || !bulkFormData.password || bulkFormData.count < 1) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSaving(true);
    toast.info(`Creating ${bulkFormData.count} users... This feature requires Supabase Edge Function for user creation.`);
    
    // Note: Bulk user creation requires a Supabase Edge Function to create auth users
    // This is a placeholder - actual implementation would call an edge function
    setTimeout(() => {
      toast.warning("Bulk user creation requires an Edge Function to be implemented. Users need to be created through Supabase Auth.");
      setIsSaving(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage platform users</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User List ({filteredUsers.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Cash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{`${user.first_name || ""} ${user.last_name || ""}`.trim() || "-"}</TableCell>
                    <TableCell>{user.mobile || "-"}</TableCell>
                    <TableCell>{user.points_balance || 0}</TableCell>
                    <TableCell>${(user.cash_balance || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)}>
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

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
            <DialogDescription>Update user details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Balance</Label>
                <Input
                  type="number"
                  value={formData.points_balance}
                  onChange={(e) => setFormData({ ...formData, points_balance: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cash Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cash_balance}
                  onChange={(e) => setFormData({ ...formData, cash_balance: parseFloat(e.target.value) })}
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
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create single or bulk users</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="single" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single User</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Creation</TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={addFormData.first_name}
                    onChange={(e) => setAddFormData({ ...addFormData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={addFormData.last_name}
                    onChange={(e) => setAddFormData({ ...addFormData, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input
                    value={addFormData.username}
                    onChange={(e) => setAddFormData({ ...addFormData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input
                    value={addFormData.mobile}
                    onChange={(e) => setAddFormData({ ...addFormData, mobile: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={addFormData.country}
                    onChange={(e) => setAddFormData({ ...addFormData, country: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Note: User creation requires Supabase Auth. Users will need to sign up through the registration page.
              </p>
            </TabsContent>
            <TabsContent value="bulk" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Username *</Label>
                  <Input
                    value={bulkFormData.base_username}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, base_username: e.target.value })}
                    placeholder="user"
                  />
                  <p className="text-xs text-muted-foreground">Users will be: user1, user2, user3...</p>
                </div>
                <div className="space-y-2">
                  <Label>Common Password *</Label>
                  <Input
                    type="password"
                    value={bulkFormData.password}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={bulkFormData.country}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>How Many Users *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkFormData.count}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, count: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleBulkCreate} disabled={isSaving} className="w-full">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create {bulkFormData.count} Users
              </Button>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
