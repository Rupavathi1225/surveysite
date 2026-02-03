import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";

interface Contest {
  id: string;
  title: string;
  description: string;
  amount: number;
  start_date: string;
  end_date: string;
  status: string;
}

export default function Contest() {
  const { profile } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    const { data, error } = await supabase
      .from("contests")
      .select("*")
      .eq("status", "active")
      .order("start_date", { ascending: false });

    if (!error && data) {
      setContests(data);
    }
    setIsLoading(false);
  };

  const isContestActive = (contest: Contest) => {
    const now = new Date();
    return new Date(contest.start_date) <= now && new Date(contest.end_date) >= now;
  };

  const joinContest = async (contestId: string) => {
    if (!profile?.id) return;

    const { error } = await supabase.from("contest_entries").insert({
      contest_id: contestId,
      user_id: profile.id,
    });

    if (error) {
      if (error.code === "23505") {
        // Already joined
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contests</h1>
        <p className="text-muted-foreground">Participate in contests and win prizes</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : contests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active contests</p>
            <p className="text-sm">Check back later for new contests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {contests.map((contest) => {
            const active = isContestActive(contest);
            return (
              <Card key={contest.id} className={`overflow-hidden ${active ? "border-primary" : ""}`}>
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        {contest.title}
                      </CardTitle>
                      <CardDescription>{contest.description}</CardDescription>
                    </div>
                    <Badge variant={active ? "default" : "secondary"}>
                      {active ? "Active" : "Upcoming"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Prize Pool</p>
                        <p className="font-bold text-primary">${contest.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ends</p>
                        <p className="font-medium">
                          {format(new Date(contest.end_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!active}
                    onClick={() => joinContest(contest.id)}
                  >
                    {active ? "Join Contest" : "Coming Soon"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
