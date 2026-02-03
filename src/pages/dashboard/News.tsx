import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar } from "lucide-react";
import { format } from "date-fns";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  status: string;
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNews(data);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">News & Updates</h1>
        <p className="text-muted-foreground">Latest announcements and updates</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No news at the moment</p>
            <p className="text-sm">Check back later for updates</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-primary" />
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(item.created_at), "MMM dd, yyyy")}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
