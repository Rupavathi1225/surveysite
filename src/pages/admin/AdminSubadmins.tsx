import { useState, useEffect, useMemo } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
import { Shield, Plus, Trash2, Loader2, Search, UserCheck, Settings2, RefreshCw, Save, Edit2 } from "lucide-react";
 import { toast } from "sonner";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
 
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
   permissions?: string[];
 }
 
 interface User {
   id: string;
   user_id: string;
   username: string;
   email: string;
 }
 
 const AVAILABLE_PERMISSIONS = [
   { key: "offers_management", label: "Offers Management" },
   { key: "promo_codes", label: "Promo Codes" },
   { key: "bonus_management", label: "Bonus Management" },
   { key: "offer_access_requests", label: "Offer Access Requests" },
   { key: "placement_approval", label: "Placement Approval" },
   { key: "offerwall_analytics", label: "Offerwall Analytics" },
   { key: "comprehensive_analytics", label: "Comprehensive Analytics" },
   { key: "click_tracking", label: "Click Tracking" },
   { key: "login_logs", label: "Login Logs" },
   { key: "active_users", label: "Active Users" },
   { key: "fraud_management", label: "Fraud Management" },
   { key: "analytics", label: "Analytics" },
   { key: "reports", label: "Reports" },
   { key: "tracking", label: "Tracking" },
   { key: "test_tracking", label: "Test Tracking" },
   { key: "partners", label: "Partners" },
   { key: "postback_logs", label: "Postback Logs" },
   { key: "postback_receiver", label: "Postback Receiver" },
   { key: "publishers", label: "Publishers" },
   { key: "subadmin_management", label: "Subadmin Management" },
 ];
 
 export default function AdminSubadmins() {
   const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
   const [allUsers, setAllUsers] = useState<User[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const [selectedUserId, setSelectedUserId] = useState("");
   const [selectedSubadminForPermissions, setSelectedSubadminForPermissions] = useState<Subadmin | null>(null);
   const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
   const [isSavingPermissions, setIsSavingPermissions] = useState(false);
 
   useEffect(() => {
     fetchSubadmins();
     fetchAllUsers();
   }, []);
 
   const fetchSubadmins = async () => {
     setIsLoading(true);
     const { data: rolesData, error } = await supabase
       .from("user_roles")
       .select("*")
       .in("role", ["subadmin", "admin"])
       .order("created_at", { ascending: false });
 
     if (!error && rolesData) {
       const userIds = rolesData.map(r => r.user_id);
       const { data: profiles } = await supabase
         .from("profiles")
         .select("user_id, username, email, first_name, last_name")
         .in("user_id", userIds);
 
       const { data: permissionsData } = await supabase
         .from("subadmin_permissions")
         .select("*")
         .in("user_id", userIds);
 
       const enrichedData = rolesData.map(role => ({
         ...role,
         profile: profiles?.find(p => p.user_id === role.user_id),
         permissions: (permissionsData as { user_id: string; permission_key: string }[] | null)?.filter(p => p.user_id === role.user_id).map(p => p.permission_key) || [],
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
     if (!error && data) setAllUsers(data);
   };
 
   const handleAddSubadmin = async () => {
     if (!selectedUserId) {
       toast.error("Please select a user");
       return;
     }
     setIsSaving(true);
 
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
 
     const { error } = await supabase.from("user_roles").insert({ user_id: selectedUserId, role: "subadmin" });
     if (error) toast.error("Failed to add subadmin");
     else {
       toast.success("Subadmin added successfully!");
       setIsDialogOpen(false);
       setSelectedUserId("");
       fetchSubadmins();
     }
     setIsSaving(false);
   };
 
   const handleRemoveRole = async (roleId: string, roleName: string, userId: string) => {
     if (roleName === "admin") {
       toast.error("Cannot remove admin role from here");
       return;
     }
     if (!confirm("Are you sure you want to remove this subadmin?")) return;
 
     await supabase.from("subadmin_permissions").delete().eq("user_id", userId);
     const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
     if (error) toast.error("Failed to remove subadmin");
     else {
       toast.success("Subadmin removed!");
       fetchSubadmins();
     }
   };
 
   const handleSelectSubadminForPermissions = (subadmin: Subadmin) => {
     setSelectedSubadminForPermissions(subadmin);
     setSelectedPermissions(subadmin.permissions || []);
   };
 
   const handleTogglePermission = (permissionKey: string) => {
     setSelectedPermissions(prev => 
       prev.includes(permissionKey) ? prev.filter(p => p !== permissionKey) : [...prev, permissionKey]
     );
   };
 
   const handleSelectAllPermissions = () => {
     if (selectedPermissions.length === AVAILABLE_PERMISSIONS.length) {
       setSelectedPermissions([]);
     } else {
       setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.key));
     }
   };
 
   const handleSavePermissions = async () => {
     if (!selectedSubadminForPermissions) return;
     setIsSavingPermissions(true);
     
     await supabase.from("subadmin_permissions").delete().eq("user_id", selectedSubadminForPermissions.user_id);
     
     if (selectedPermissions.length > 0) {
       const permissionsToInsert = selectedPermissions.map(key => ({
         user_id: selectedSubadminForPermissions.user_id,
         permission_key: key,
       }));
       const { error } = await supabase.from("subadmin_permissions").insert(permissionsToInsert);
       if (error) {
         toast.error("Failed to update permissions");
         setIsSavingPermissions(false);
         return;
       }
     }
     
     toast.success("Permissions updated successfully!");
     setIsSavingPermissions(false);
     setSelectedSubadminForPermissions(null);
     fetchSubadmins();
   };
 
   const filteredUsers = allUsers.filter(
     user => user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase())
   );
 
   const subadminsOnly = subadmins.filter(s => s.role === "subadmin");
  const adminsOnly = subadmins.filter(s => s.role === "admin");
 
  const selectedSubadminProfile = useMemo(() => {
    if (!selectedSubadminForPermissions) return null;
    return selectedSubadminForPermissions.profile;
  }, [selectedSubadminForPermissions]);

   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold">Subadmin Management</h1>
           <p className="text-muted-foreground">Manage subadmin users and their tab-level permissions</p>
         </div>
         <div className="flex gap-2">
           <Button variant="outline" onClick={fetchSubadmins}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
           <Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Subadmin</Button>
         </div>
       </div>
 
       {/* Update Permissions Section */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" />Update Subadmin Permissions</CardTitle>
           <p className="text-sm text-muted-foreground">Select a user and assign tab-level permissions</p>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="space-y-2">
             <Label>Select User</Label>
             <Select 
               value={selectedSubadminForPermissions?.user_id || ""} 
               onValueChange={(userId) => {
                 const subadmin = subadminsOnly.find(s => s.user_id === userId);
                 if (subadmin) handleSelectSubadminForPermissions(subadmin);
               }}
             >
              <SelectTrigger className="w-full">
                {selectedSubadminProfile ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedSubadminProfile.username}</span>
                    <span className="text-muted-foreground">({selectedSubadminProfile.email})</span>
                    <Badge variant="secondary">Subadmin</Badge>
                  </div>
                ) : (
                  <SelectValue placeholder="Choose a subadmin to manage permissions" />
                )}
              </SelectTrigger>
               <SelectContent>
                 {subadminsOnly.map((subadmin) => (
                   <SelectItem key={subadmin.user_id} value={subadmin.user_id}>
                     <div className="flex items-center gap-2">
                       <span>{subadmin.profile?.username || "Unknown"}</span>
                       <span className="text-muted-foreground">({subadmin.profile?.email})</span>
                       <Badge variant="secondary">Subadmin</Badge>
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
          
           {selectedSubadminForPermissions && (
             <>
              <Separator />
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Tab Permissions</Label>
                   <Button variant="ghost" size="sm" onClick={handleSelectAllPermissions}>
                     {selectedPermissions.length === AVAILABLE_PERMISSIONS.length ? "Deselect All" : "Select All"}
                   </Button>
                 </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                   {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.key} className="flex items-center space-x-3">
                       <Checkbox
                         id={permission.key}
                         checked={selectedPermissions.includes(permission.key)}
                         onCheckedChange={() => handleTogglePermission(permission.key)}
                       />
                      <Label htmlFor={permission.key} className="cursor-pointer font-normal text-sm">{permission.label}</Label>
                     </div>
                   ))}
                 </div>
                 
                <p className="text-sm text-primary font-medium">{selectedPermissions.length} of {AVAILABLE_PERMISSIONS.length} tabs selected</p>
               </div>
               
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSavePermissions} disabled={isSavingPermissions}>
                 {isSavingPermissions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                 Update Permissions
               </Button>
             </>
           )}
         </CardContent>
       </Card>
 
       {/* Existing Subadmins List */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Existing Subadmins ({subadminsOnly.length + adminsOnly.length})</h2>
          <p className="text-sm text-muted-foreground">List of all users with subadmin permissions</p>
        </div>
        
        <div className="space-y-4">
           {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : (subadminsOnly.length === 0 && adminsOnly.length === 0) ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No subadmins found</p>
                  <p className="text-sm mt-1">Add a subadmin to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Show Admins first */}
              {adminsOnly.map((admin) => (
                <Card key={admin.id} className="border-primary/30">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{admin.profile?.username || "Unknown"}</span>
                          <Badge variant="default">Admin</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{admin.profile?.email || "-"}</p>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Allowed Tabs:</p>
                          <span className="text-sm text-muted-foreground">All permissions (Admin)</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-muted-foreground">Protected</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Show Subadmins */}
              {subadminsOnly.map((subadmin) => (
                <Card key={subadmin.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{subadmin.profile?.username || "Unknown"}</span>
                          <Badge variant="secondary">Subadmin</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{subadmin.profile?.email || "-"}</p>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Allowed Tabs:</p>
                          <div className="flex flex-wrap gap-2">
                            {(subadmin.permissions && subadmin.permissions.length > 0) ? (
                              subadmin.permissions.map((perm) => {
                                const permLabel = AVAILABLE_PERMISSIONS.find(p => p.key === perm)?.label || perm;
                                return (
                                  <Badge key={perm} variant="outline" className="text-xs">
                                    {permLabel}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-sm text-muted-foreground">No permissions assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSelectSubadminForPermissions(subadmin)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRemoveRole(subadmin.id, subadmin.role, subadmin.user_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
 
       {/* Add Subadmin Dialog */}
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" />Add New Subadmin</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label>Search User</Label>
               <div className="relative">
                 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Search by username or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
               </div>
             </div>
             <div className="space-y-2">
               <Label>Select User</Label>
               <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                 <SelectTrigger><SelectValue placeholder="Choose a user to make subadmin" /></SelectTrigger>
                 <SelectContent className="max-h-60">
                   {filteredUsers.map((user) => (
                     <SelectItem key={user.user_id} value={user.user_id}>{user.username} ({user.email})</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <p className="text-sm text-muted-foreground">Subadmins can access the admin panel and manage certain sections.</p>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
             <Button onClick={handleAddSubadmin} disabled={isSaving || !selectedUserId}>
               {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Add Subadmin
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }