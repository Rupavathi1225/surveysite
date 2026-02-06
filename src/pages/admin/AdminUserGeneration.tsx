import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Upload, Sparkles, Clock, Loader2, CheckCircle, Link, FileSpreadsheet, Eye, EyeOff, Copy, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface GeneratedUser {
  username: string;
  email: string;
  password: string;
  userId: string;
  profileId: string;
  scheduledAt: string;
  method: string;
  country: string;
}

export default function AdminUserGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUsers, setGeneratedUsers] = useState<GeneratedUser[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [activeResultTab, setActiveResultTab] = useState("all");
  const [enableScheduling, setEnableScheduling] = useState(true);
  
  // Manual form
  const [manualUsername, setManualUsername] = useState("");
  const [manualCount, setManualCount] = useState(10);
  const [manualCountry, setManualCountry] = useState("India");
  const [manualTimeGap, setManualTimeGap] = useState(20);

  // Bulk form
  const [bulkUsernames, setBulkUsernames] = useState("");
  const [bulkCount, setBulkCount] = useState(30);
  const [bulkCountry, setBulkCountry] = useState("India");
  const [bulkTimeGap, setBulkTimeGap] = useState(20);
  const [googleSheetLink, setGoogleSheetLink] = useState("");

  // AI form
  const [aiStyle, setAiStyle] = useState("modern");
  const [aiLetters, setAiLetters] = useState(4);
  const [aiNumbers, setAiNumbers] = useState(5);
  const [aiShuffle, setAiShuffle] = useState(2);
  const [aiCount, setAiCount] = useState(50);
  const [aiCountry, setAiCountry] = useState("India");
  const [aiTimeGap, setAiTimeGap] = useState(20);

  // Handle file upload for CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const names = text
        .split(/[\n,]/)
        .map(n => n.trim().replace(/"/g, ''))
        .filter(Boolean);
      setBulkUsernames(names.join('\n'));
      toast.success(`Loaded ${names.length} usernames from file`);
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const getTimeGap = (method: string) => {
    if (!enableScheduling) return 0;
    if (method === "manual") return manualTimeGap;
    if (method === "bulk_csv") return bulkTimeGap;
    return aiTimeGap;
  };

  const generateUsers = async (method: "manual" | "bulk_csv" | "ai_based") => {
    setIsLoading(true);

    try {
      let body: Record<string, unknown> = {};
      const timeGap = enableScheduling ? getTimeGap(method) : 0;

      if (method === "manual") {
        if (!manualUsername.trim()) {
          toast.error("Please enter a base username");
          setIsLoading(false);
          return;
        }
        body = {
          method: "manual",
          baseUsername: manualUsername.trim(),
          count: manualCount,
          country: manualCountry,
          timeGapMinutes: timeGap,
        };
      } else if (method === "bulk_csv") {
        const names = bulkUsernames.split("\n").map(n => n.trim()).filter(Boolean);
        if (names.length === 0) {
          toast.error("Please enter at least one username");
          setIsLoading(false);
          return;
        }
        body = {
          method: "bulk_csv",
          baseUsernames: names,
          count: bulkCount,
          country: bulkCountry,
          timeGapMinutes: timeGap,
        };
      } else {
        body = {
          method: "ai_based",
          usernameStyle: aiStyle,
          letterCount: aiLetters,
          numberCount: aiNumbers,
          shuffleAfter: aiShuffle,
          count: aiCount,
          country: aiCountry,
          timeGapMinutes: timeGap,
        };
      }

      const { data, error } = await supabase.functions.invoke("generate-usernames", { body });

      if (error) throw error;

      if (data.success) {
        setGeneratedUsers(prev => [...data.users, ...prev]);
        toast.success(`Successfully created ${data.created} users!`);
        setActiveResultTab(method);
      } else {
        throw new Error(data.error || "Failed to generate users");
      }
    } catch (err) {
      console.error("Generation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate users");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "manual":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Manual</Badge>;
      case "bulk_csv":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">Bulk</Badge>;
      case "ai_based":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">AI</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredUsers = activeResultTab === "all" 
    ? generatedUsers 
    : generatedUsers.filter(u => u.method === activeResultTab);

  const getUserCountByMethod = (method: string) => 
    generatedUsers.filter(u => u.method === method).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Generation</h1>
        <p className="text-muted-foreground">Create users with controlled activity scheduling</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generation Methods</CardTitle>
            <CardDescription>Choose how to create users</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Scheduling Toggle */}
            <div className="flex items-center justify-between p-3 mb-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Activity Scheduling</p>
                  <p className="text-xs text-muted-foreground">
                    {enableScheduling 
                      ? "Users appear gradually in activity feed" 
                      : "Users appear immediately"}
                  </p>
                </div>
              </div>
              <Switch
                checked={enableScheduling}
                onCheckedChange={setEnableScheduling}
              />
            </div>

            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Bulk
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI
                </TabsTrigger>
              </TabsList>

              {/* Manual Tab */}
              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Base Username</Label>
                  <Input
                    placeholder="e.g., suraj"
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Will generate: {manualUsername || "user"}_1023, {manualUsername || "user"}_8471, etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Number of Users: {manualCount}</Label>
                  <Slider
                    value={[manualCount]}
                    onValueChange={([v]) => setManualCount(v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={manualCountry} onValueChange={setManualCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {enableScheduling && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Gap: {manualTimeGap} minutes
                    </Label>
                    <Slider
                      value={[manualTimeGap]}
                      onValueChange={([v]) => setManualTimeGap(v)}
                      min={1}
                      max={120}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      User 1 at now, User 2 after {manualTimeGap} mins, User 3 after {manualTimeGap * 2} mins...
                    </p>
                  </div>
                )}

                <Button 
                  onClick={() => generateUsers("manual")} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <User className="h-4 w-4 mr-2" />}
                  Generate {manualCount} Users
                </Button>
              </TabsContent>

              {/* Bulk Tab */}
              <TabsContent value="bulk" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Google Sheet Link (optional)
                  </Label>
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={googleSheetLink}
                    onChange={(e) => setGoogleSheetLink(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sheet must be publicly accessible with usernames in first column
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Upload CSV/Excel File
                  </Label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Base Usernames (one per line)</Label>
                  <Textarea
                    placeholder={"suraj\nsuresh\nsanjay"}
                    value={bulkUsernames}
                    onChange={(e) => setBulkUsernames(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Users to Generate: {bulkCount}</Label>
                  <Slider
                    value={[bulkCount]}
                    onValueChange={([v]) => setBulkCount(v)}
                    min={1}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={bulkCountry} onValueChange={setBulkCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {enableScheduling && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Gap: {bulkTimeGap} minutes
                    </Label>
                    <Slider
                      value={[bulkTimeGap]}
                      onValueChange={([v]) => setBulkTimeGap(v)}
                      min={1}
                      max={120}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      User 1 at now, User 2 after {bulkTimeGap} mins, User 3 after {bulkTimeGap * 2} mins...
                    </p>
                  </div>
                )}

                <Button 
                  onClick={() => generateUsers("bulk_csv")} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Generate {bulkCount} Users from List
                </Button>
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Username Style</Label>
                  <Select value={aiStyle} onValueChange={setAiStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="gamer">Gamer</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Letters: {aiLetters}</Label>
                    <Slider
                      value={[aiLetters]}
                      onValueChange={([v]) => setAiLetters(v)}
                      min={2}
                      max={8}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Numbers: {aiNumbers}</Label>
                    <Slider
                      value={[aiNumbers]}
                      onValueChange={([v]) => setAiNumbers(v)}
                      min={2}
                      max={8}
                      step={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Shuffle After: {aiShuffle} characters</Label>
                  <Slider
                    value={[aiShuffle]}
                    onValueChange={([v]) => setAiShuffle(v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Users: {aiCount}</Label>
                  <Slider
                    value={[aiCount]}
                    onValueChange={([v]) => setAiCount(v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={aiCountry} onValueChange={setAiCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {enableScheduling && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Gap: {aiTimeGap} minutes
                    </Label>
                    <Slider
                      value={[aiTimeGap]}
                      onValueChange={([v]) => setAiTimeGap(v)}
                      min={1}
                      max={120}
                      step={1}
                    />
                  </div>
                )}

                <Button 
                  onClick={() => generateUsers("ai_based")} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate {aiCount} AI Users
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Results Panel with Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generated Users
            </CardTitle>
            <CardDescription>
              {generatedUsers.length > 0 
                ? `${generatedUsers.length} users created with login credentials`
                : "Users will appear here after generation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No users generated yet</p>
                <p className="text-sm">Choose a method and generate users</p>
              </div>
            ) : (
              <>
                {/* Section Tabs */}
                <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="mb-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      All ({generatedUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Manual ({getUserCountByMethod("manual")})
                    </TabsTrigger>
                    <TabsTrigger value="bulk_csv" className="flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      Bulk ({getUserCountByMethod("bulk_csv")})
                    </TabsTrigger>
                    <TabsTrigger value="ai_based" className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI ({getUserCountByMethod("ai_based")})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredUsers.map((user, index) => (
                      <div
                        key={user.userId}
                        className="p-3 rounded-lg border bg-card space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.username}</p>
                                {getMethodBadge(user.method)}
                              </div>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="text-xs">
                              {user.country}
                            </Badge>
                          </div>
                        </div>

                        {/* Password Row */}
                        <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                          <span className="text-xs text-muted-foreground">Password:</span>
                          <code className="text-xs font-mono flex-1">
                            {showPasswords[user.userId] ? user.password : "••••••••••••"}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => togglePasswordVisibility(user.userId)}
                          >
                            {showPasswords[user.userId] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(user.password)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Scheduled Time */}
                        {enableScheduling && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Appears in feed at: {formatTime(user.scheduledAt)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Export Button */}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    const csv = "Username,Email,Password,Country,Method,Scheduled At\n" + 
                      filteredUsers.map(u => 
                        `${u.username},${u.email},${u.password},${u.country},${u.method},${u.scheduledAt}`
                      ).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `generated-users-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
