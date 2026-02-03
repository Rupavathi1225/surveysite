import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal, Trophy, Crown } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  points: number;
  rank: number;
  profiles: {
    username: string;
    country: string;
  };
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // Get top users by points balance
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, country, points_balance")
      .order("points_balance", { ascending: false })
      .limit(100);

    if (!error && data) {
      setEntries(
        data.map((item, index) => ({
          id: item.id,
          user_id: item.id,
          points: item.points_balance || 0,
          rank: index + 1,
          profiles: {
            username: item.username,
            country: item.country || "Unknown",
          },
        }))
      );
    }
    setIsLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500">1st</Badge>;
      case 2:
        return <Badge className="bg-gray-400">2nd</Badge>;
      case 3:
        return <Badge className="bg-amber-600">3rd</Badge>;
      default:
        return <Badge variant="outline">{rank}th</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top earners on the platform</p>
      </div>

      {/* Top 3 */}
      {!isLoading && entries.length >= 3 && (
        <div className="grid md:grid-cols-3 gap-4">
          {[entries[1], entries[0], entries[2]].map((entry, displayIndex) => {
            const isFirst = displayIndex === 1;
            return (
              <Card
                key={entry.id}
                className={`text-center ${isFirst ? "md:-mt-4 border-primary shadow-lg" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    {entry.rank === 1 ? (
                      <Crown className="h-12 w-12 mx-auto text-yellow-500" />
                    ) : entry.rank === 2 ? (
                      <Medal className="h-10 w-10 mx-auto text-gray-400" />
                    ) : (
                      <Medal className="h-10 w-10 mx-auto text-amber-600" />
                    )}
                  </div>
                  <p className="font-bold text-lg">{entry.profiles.username}</p>
                  <p className="text-sm text-muted-foreground mb-2">{entry.profiles.country}</p>
                  <Badge className="bg-primary text-lg px-4 py-1">{entry.points} pts</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Full Rankings
          </CardTitle>
          <CardDescription>Top 100 users by points earned</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No rankings available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className={entry.rank <= 3 ? "bg-primary/5" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">{getRankIcon(entry.rank)}</div>
                    </TableCell>
                    <TableCell className="font-medium">{entry.profiles.username}</TableCell>
                    <TableCell>{entry.profiles.country}</TableCell>
                    <TableCell className="text-right font-bold">{entry.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
