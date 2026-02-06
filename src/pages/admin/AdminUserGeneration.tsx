import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { User, Upload, Sparkles, Clock, Loader2, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GeneratedUser {
  username: string;
  email: string;
  userId: string;
  scheduledAt: string;
}

export default function AdminUserGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUsers, setGeneratedUsers] = useState<GeneratedUser[]>([]);
  
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

  // AI form
  const [aiStyle, setAiStyle] = useState("modern");
  const [aiLetters, setAiLetters] = useState(4);
  const [aiNumbers, setAiNumbers] = useState(5);
  const [aiShuffle, setAiShuffle] = useState(2);
  const [aiCount, setAiCount] = useState(50);
  const [aiCountry, setAiCountry] = useState("India");
  const [aiTimeGap, setAiTimeGap] = useState(20);

  const generateUsers = async (method: "manual" | "bulk_csv" | "ai_based") => {
    setIsLoading(true);
    setGeneratedUsers([]);

    try {
      let body: Record<string, unknown> = {};

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
          timeGapMinutes: manualTimeGap,
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
          timeGapMinutes: bulkTimeGap,
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
          timeGapMinutes: aiTimeGap,
        };
      }

      const { data, error } = await supabase.functions.invoke("generate-usernames", { body });

      if (error) throw error;

      if (data.success) {
        setGeneratedUsers(data.users);
        toast.success(`Successfully created ${data.created} users!`);
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
                    Each user's signup will appear {manualTimeGap} minutes apart in the activity feed
                  </p>
                </div>

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
                  <Label>Base Usernames (one per line)</Label>
                  <Textarea
                    placeholder={"suraj\nsuresh\nsanjay"}
                    value={bulkUsernames}
                    onChange={(e) => setBulkUsernames(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each name will generate multiple users with random suffixes
                  </p>
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
                </div>

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
                  <p className="text-xs text-muted-foreground">
                    Pattern changes after every {aiShuffle} characters
                  </p>
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

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generated Users
            </CardTitle>
            <CardDescription>
              {generatedUsers.length > 0 
                ? `${generatedUsers.length} users created with scheduled activities`
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
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {generatedUsers.map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Appears at</p>
                        <p className="text-sm">{formatTime(user.scheduledAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
