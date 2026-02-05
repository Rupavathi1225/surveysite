 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Tag, Plus, Edit, Trash2, Loader2, Copy, Gift, Search, BarChart3, Users, Play } from "lucide-react";
 import { toast } from "sonner";
 import { format } from "date-fns";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Switch } from "@/components/ui/switch";
 import { Textarea } from "@/components/ui/textarea";
 import { Checkbox } from "@/components/ui/checkbox";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 interface Promocode {
   id: string;
   code: string;
   name?: string | null;
   description?: string | null;
   reward: number;
   bonus_type?: string | null;
   is_gift_card?: boolean | null;
   credit_amount?: number | null;
   max_uses: number | null;
   max_uses_per_user?: number | null;
   current_uses: number | null;
   start_date?: string | null;
   expires_at: string | null;
   time_based_validity?: boolean | null;
   start_time?: string | null;
   end_time?: string | null;
   timezone?: string | null;
   auto_deactivate?: boolean | null;
   status: string | null;
   created_at: string;
 }
 
 interface FormData {
   code: string;
   name: string;
   description: string;
   bonus_type: string;
   reward: number;
   is_gift_card: boolean;
   credit_amount: number;
   start_date: string;
   expires_at: string;
   max_uses: number;
   max_uses_per_user: number;
   time_based_validity: boolean;
   start_time: string;
   end_time: string;
   timezone: string;
   auto_deactivate: boolean;
   status: string;
 }
 
 const TIMEZONES = ["UTC", "Asia/Kolkata (IST)", "America/New_York (EST)", "America/Los_Angeles (PST)", "Europe/London (GMT)", "Europe/Paris (CET)"];
 
 export default function AdminPromocodes() {
   const [promocodes, setPromocodes] = useState<Promocode[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [editingPromocode, setEditingPromocode] = useState<Promocode | null>(null);
   const [isAddOpen, setIsAddOpen] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [search, setSearch] = useState("");
   const [formData, setFormData] = useState<FormData>({
     code: "", name: "", description: "", bonus_type: "percentage", reward: 0, is_gift_card: false,
     credit_amount: 0, start_date: "", expires_at: "", max_uses: 100, max_uses_per_user: 1,
     time_based_validity: false, start_time: "00:00", end_time: "23:59", timezone: "Asia/Kolkata (IST)",
     auto_deactivate: true, status: "active",
   });
 
   useEffect(() => { fetchPromocodes(); }, []);
 
   const fetchPromocodes = async () => {
     setIsLoading(true);
     const { data, error } = await supabase.from("promocodes").select("*").order("created_at", { ascending: false });
     if (!error && data) setPromocodes(data as Promocode[]);
     setIsLoading(false);
   };
 
   const handleSave = async () => {
     setIsSaving(true);
     const payload = {
       code: formData.code.toUpperCase(), name: formData.name || null, description: formData.description || null,
       bonus_type: formData.bonus_type, reward: formData.reward, is_gift_card: formData.is_gift_card,
       credit_amount: formData.is_gift_card ? formData.credit_amount : null, start_date: formData.start_date || null,
       expires_at: formData.expires_at || null, max_uses: formData.max_uses, max_uses_per_user: formData.max_uses_per_user,
       time_based_validity: formData.time_based_validity,
       start_time: formData.time_based_validity ? formData.start_time : null,
       end_time: formData.time_based_validity ? formData.end_time : null,
       timezone: formData.time_based_validity ? formData.timezone : null,
       auto_deactivate: formData.auto_deactivate, status: formData.status,
     };
 
     if (editingPromocode) {
       const { error } = await supabase.from("promocodes").update(payload).eq("id", editingPromocode.id);
       if (error) toast.error("Failed to update");
       else { toast.success("Promocode updated!"); setEditingPromocode(null); fetchPromocodes(); }
     } else {
       const { error } = await supabase.from("promocodes").insert(payload);
       if (error) toast.error("Failed to create");
       else { toast.success("Promocode created!"); setIsAddOpen(false); fetchPromocodes(); }
     }
     setIsSaving(false);
   };
 
   const handleDelete = async (id: string) => {
     if (!confirm("Are you sure you want to delete this promocode?")) return;
     const { error } = await supabase.from("promocodes").delete().eq("id", id);
     if (error) toast.error("Failed to delete");
     else { toast.success("Promocode deleted!"); fetchPromocodes(); }
   };
 
   const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Code copied!"); };
 
   const openEdit = (item: Promocode) => {
     setFormData({
       code: item.code, name: item.name || "", description: item.description || "", bonus_type: item.bonus_type || "percentage",
       reward: item.reward, is_gift_card: item.is_gift_card || false, credit_amount: item.credit_amount || 0,
       start_date: item.start_date ? item.start_date.split("T")[0] : "", expires_at: item.expires_at ? item.expires_at.split("T")[0] : "",
       max_uses: item.max_uses || 100, max_uses_per_user: item.max_uses_per_user || 1, time_based_validity: item.time_based_validity || false,
       start_time: item.start_time || "00:00", end_time: item.end_time || "23:59", timezone: item.timezone || "Asia/Kolkata (IST)",
       auto_deactivate: item.auto_deactivate ?? true, status: item.status || "active",
     });
     setEditingPromocode(item);
   };
 
   const openAdd = () => {
     setFormData({
       code: "", name: "", description: "", bonus_type: "percentage", reward: 0, is_gift_card: false, credit_amount: 0,
       start_date: new Date().toISOString().split("T")[0], expires_at: "", max_uses: 1000, max_uses_per_user: 1,
       time_based_validity: false, start_time: "00:00", end_time: "23:59", timezone: "Asia/Kolkata (IST)",
       auto_deactivate: true, status: "active",
     });
     setIsAddOpen(true);
   };
 
   const filteredPromocodes = promocodes.filter(p => p.code.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase()));
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold">Promo Code Management</h1>
           <p className="text-muted-foreground">Create and manage promotional codes</p>
         </div>
         <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Create Promo Code</Button>
       </div>
 
       <div className="relative max-w-md">
         <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
         <Input placeholder="Search by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Promo Codes ({filteredPromocodes.length})</CardTitle>
           <p className="text-sm text-muted-foreground">Manage all promotional codes and track their performance</p>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
           ) : filteredPromocodes.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground"><Tag className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No promocodes found</p></div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Code</TableHead>
                   <TableHead>Name</TableHead>
                   <TableHead>Bonus</TableHead>
                   <TableHead>Uses</TableHead>
                   <TableHead>Distributed</TableHead>
                   <TableHead>Valid Until</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredPromocodes.map((item) => (
                   <TableRow key={item.id}>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <code className="bg-secondary px-2 py-1 rounded font-mono">{item.code}</code>
                         <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyCode(item.code)}><Copy className="h-3 w-3" /></Button>
                       </div>
                     </TableCell>
                     <TableCell className="text-muted-foreground">{item.name || "-"}</TableCell>
                     <TableCell className="font-medium">
                       {item.is_gift_card ? <span className="text-green-600">${item.credit_amount}</span> : 
                        <span>{item.bonus_type === "percentage" ? `${item.reward}%` : `${item.reward} pts`}</span>}
                     </TableCell>
                     <TableCell>{item.current_uses || 0} / {item.max_uses || "∞"}</TableCell>
                     <TableCell className="text-muted-foreground">${((item.current_uses || 0) * (item.credit_amount || item.reward || 0)).toFixed(2)}</TableCell>
                     <TableCell className="text-muted-foreground">{item.expires_at ? format(new Date(item.expires_at), "M/d/yyyy") : "Never"}</TableCell>
                     <TableCell>
                       <Badge variant={item.status === "active" ? "default" : item.status === "expired" ? "destructive" : "secondary"}>{item.status}</Badge>
                     </TableCell>
                     <TableCell>
                       <div className="flex gap-1">
                         <Button size="sm" variant="ghost" title="Analytics"><BarChart3 className="h-4 w-4" /></Button>
                         <Button size="sm" variant="ghost" title="Users"><Users className="h-4 w-4" /></Button>
                         <Button size="sm" variant="ghost" title="Activate" className="text-green-600"><Play className="h-4 w-4" /></Button>
                         <Button size="sm" variant="ghost" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                         <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>
 
       <Dialog open={isAddOpen || !!editingPromocode} onOpenChange={() => { setIsAddOpen(false); setEditingPromocode(null); }}>
         <DialogContent className="max-w-lg max-h-[90vh]">
           <DialogHeader>
             <DialogTitle>{editingPromocode ? "Edit Promo Code" : "Create New Promo Code"}</DialogTitle>
             <p className="text-sm text-muted-foreground">Create a new promotional code with bonus settings</p>
           </DialogHeader>
           <ScrollArea className="max-h-[60vh] pr-4">
             <div className="space-y-4 py-4 px-1">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Code *</Label>
                   <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g., SUMMER20" />
                 </div>
                 <div className="space-y-2">
                   <Label>Name *</Label>
                   <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Summer 20% Bonus" />
                 </div>
               </div>
               
               <div className="space-y-2">
                 <Label>Description</Label>
                 <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" rows={2} />
               </div>
               
               <div className="flex items-center justify-between p-4 border rounded-lg">
                 <div className="flex items-center gap-3">
                   <Gift className="h-5 w-5 text-red-500" />
                   <div>
                     <p className="font-medium">Gift Card Mode</p>
                     <p className="text-sm text-muted-foreground">Direct account credit instead of offer-based bonus</p>
                   </div>
                 </div>
                 <Switch checked={formData.is_gift_card} onCheckedChange={(checked) => setFormData({ ...formData, is_gift_card: checked })} />
               </div>
               
               {formData.is_gift_card ? (
                 <div className="space-y-2">
                   <Label>Credit Amount ($) *</Label>
                   <Input type="number" step="0.01" value={formData.credit_amount} onChange={(e) => setFormData({ ...formData, credit_amount: parseFloat(e.target.value) })} />
                   <p className="text-xs text-muted-foreground">This amount will be directly credited to the user's account balance</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Bonus Type *</Label>
                     <Select value={formData.bonus_type} onValueChange={(v) => setFormData({ ...formData, bonus_type: v })}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="percentage">Percentage (%)</SelectItem>
                         <SelectItem value="fixed">Fixed Points</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Bonus Amount *</Label>
                     <Input type="number" value={formData.reward} onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) })} />
                   </div>
                 </div>
               )}
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} /></div>
                 <div className="space-y-2"><Label>End Date *</Label><Input type="date" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} /></div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label>Max Uses</Label><Input type="number" value={formData.max_uses} onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })} /></div>
                 <div className="space-y-2"><Label>Max Uses Per User</Label><Input type="number" value={formData.max_uses_per_user} onChange={(e) => setFormData({ ...formData, max_uses_per_user: parseInt(e.target.value) })} /></div>
               </div>
               
               <div className="space-y-4 border rounded-lg p-4">
                 <div className="flex items-center justify-between">
                   <div><p className="font-medium">Time-Based Validity</p><p className="text-sm text-muted-foreground">Restrict this promo code to specific hours of the day</p></div>
                   <Switch checked={formData.time_based_validity} onCheckedChange={(checked) => setFormData({ ...formData, time_based_validity: checked })} />
                 </div>
                 
                 {formData.time_based_validity && (
                   <>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} /></div>
                       <div className="space-y-2"><Label>End Time</Label><Input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} /></div>
                     </div>
                     <div className="space-y-2">
                       <Label>Timezone</Label>
                       <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
                         <SelectTrigger><SelectValue /></SelectTrigger>
                         <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                       </Select>
                     </div>
                   </>
                 )}
               </div>
               
               <div className="flex items-start space-x-3 p-4 border rounded-lg">
                 <Checkbox id="auto_deactivate" checked={formData.auto_deactivate} onCheckedChange={(checked) => setFormData({ ...formData, auto_deactivate: checked as boolean })} />
                 <div>
                   <Label htmlFor="auto_deactivate" className="cursor-pointer">Auto-deactivate when max uses reached</Label>
                   <p className="text-sm text-muted-foreground">Automatically expire this code when it reaches the maximum number of uses</p>
                 </div>
               </div>
             </div>
           </ScrollArea>
           <DialogFooter>
             <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingPromocode(null); }}>Cancel</Button>
             <Button onClick={handleSave} disabled={isSaving}>
               {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
               {editingPromocode ? "Update" : "Create Promo Code"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }