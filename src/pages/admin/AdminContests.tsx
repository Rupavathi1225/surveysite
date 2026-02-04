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
import { Trophy, Plus, Edit, Trash2, Loader2, UserMinus, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface Contest {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  start_date: string;
  end_date: string;
  status: string | null;
  excluded_users: string[] | null;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

export default function AdminContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExcludeOpen, setIsExcludeOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: 0,
    start_date: "",
    end_date: "",
    status: "active",
    excluded_users: [] as string[],
  });

  useEffect(() => {
    fetchContests();
    fetchUsers();
  }, []);

  const fetchContests = async () => {
    const { data, error } = await supabase
      .from("contests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setContests(data as Contest[]);
    }
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email")
      .order("username");

    if (!error && data) {
      setAllUsers(data);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const saveData = {
      title: formData.title,
      description: formData.description,
      amount: formData.amount,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      excluded_users: formData.excluded_users,
    };
    
    if (editingContest) {
      const { error } = await supabase
        .from("contests")
        .update(saveData)
        .eq("id", editingContest.id);

      if (error) toast.error("Failed to update");
      else {
        toast.success("Contest updated!");
        setEditingContest(null);
        fetchContests();
      }
    } else {
      const { error } = await supabase.from("contests").insert(saveData);

      if (error) toast.error("Failed to create");
      else {
        toast.success("Contest created!");
        setIsAddOpen(false);
        fetchContests();
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contests").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Contest deleted!");
      fetchContests();
    }
  };

  const openEdit = (contest: Contest) => {
    setFormData({
      title: contest.title,
      description: contest.description || "",
      amount: contest.amount,
      start_date: contest.start_date.split("T")[0],
      end_date: contest.end_date.split("T")[0],
      status: contest.status || "active",
      excluded_users: contest.excluded_users || [],
    });
    setEditingContest(contest);
  };

  const openAdd = () => {
    setFormData({
      title: "",
      description: "",
      amount: 0,
      start_date: "",
      end_date: "",
      status: "active",
      excluded_users: [],
    });
    setIsAddOpen(true);
  };

  const openExcludeUsers = (contest: Contest) => {
    setSelectedContest(contest);
    setExcludedUserIds(contest.excluded_users || []);
    setIsExcludeOpen(true);
  };

  const handleSaveExclusions = async () => {
    if (!selectedContest) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from("contests")
      .update({ excluded_users: excludedUserIds })
      .eq("id", selectedContest.id);

    if (error) {
      toast.error("Failed to update exclusions");
    } else {
      toast.success("Exclusions updated!");
      setIsExcludeOpen(false);
      fetchContests();
    }
    setIsSaving(false);
  };

  const handleNotifyContestEnd = async (contest: Contest) => {
    // Check if contest has ended
    const endDate = new Date(contest.end_date);
    const now = new Date();
    
    if (endDate > now) {
      toast.error("Contest hasn't ended yet");
      return;
    }

    // Fetch contest entries with user earnings
    const { data: entries, error } = await supabase
      .from("contest_entries")
      .select("*, profiles(username, email)")
      .eq("contest_id", contest.id)
      .order("points", { ascending: false });

    if (error || !entries || entries.length === 0) {
      toast.error("No entries found for this contest");
      return;
    }

    // Create notifications for each participant
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      await supabase.from("notifications").insert({
        user_id: entry.user_id,
        title: `Contest Results: ${contest.title}`,
        message: `The contest has ended! You earned ${entry.points || 0} points and ranked #${i + 1}. Prize pool: $${contest.amount}`,
        type: "info",
        is_global: false,
      });
    }

    toast.success(`Notified ${entries.length} participants!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contests</h1>
          <p className="text-muted-foreground">Manage contest events</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            All Contests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : contests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No contests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Excluded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contests.map((contest) => (
                  <TableRow key={contest.id}>
                    <TableCell className="font-medium">{contest.title}</TableCell>
                    <TableCell>${contest.amount}</TableCell>
                    <TableCell>{format(new Date(contest.start_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{format(new Date(contest.end_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={contest.status === "active" ? "default" : "secondary"}>
                        {contest.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contest.excluded_users?.length || 0} excluded
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(contest)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openExcludeUsers(contest)} title="Manage Exclusions">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleNotifyContestEnd(contest)} title="Send End Notifications">
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(contest.id)}>
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
      <Dialog open={isAddOpen || !!editingContest} onOpenChange={() => { setIsAddOpen(false); setEditingContest(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContest ? "Edit Contest" : "Add Contest"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingContest(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exclude Users Dialog */}
      <Dialog open={isExcludeOpen} onOpenChange={setIsExcludeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exclude Users from: {selectedContest?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Select users to exclude from this contest:</Label>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              <div className="space-y-2">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={user.id}
                      checked={excludedUserIds.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExcludedUserIds([...excludedUserIds, user.id]);
                        } else {
                          setExcludedUserIds(excludedUserIds.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <label htmlFor={user.id} className="text-sm cursor-pointer flex-1">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-muted-foreground ml-2">({user.email})</span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-sm text-muted-foreground mt-2">
              {excludedUserIds.length} user(s) selected for exclusion
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExcludeOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveExclusions} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Exclusions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
