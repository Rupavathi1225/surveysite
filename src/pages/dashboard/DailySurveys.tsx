import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Star, ExternalLink } from "lucide-react";

interface SurveyLink {
  id: string;
  name: string;
  payout: number;
  link: string;
  content: string;
  rating: number;
  is_recommended: boolean;
  color_code: string;
  button_text: string;
  image_url: string;
}

interface SurveyProvider {
  id: string;
  name: string;
  code: string;
  iframe_code: string;
  content: string;
  rating: number;
  is_recommended: boolean;
  color_code: string;
  button_text: string;
  image_url: string;
}

export default function DailySurveys() {
  const [surveyLinks, setSurveyLinks] = useState<SurveyLink[]>([]);
  const [providers, setProviders] = useState<SurveyProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    const [linksRes, providersRes] = await Promise.all([
      supabase.from("survey_links").select("*").eq("status", "active"),
      supabase.from("survey_providers").select("*").eq("status", "active"),
    ]);

    if (linksRes.data) setSurveyLinks(linksRes.data);
    if (providersRes.data) setProviders(providersRes.data);
    setIsLoading(false);
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Surveys</h1>
        <p className="text-muted-foreground">Complete surveys to earn points</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <>
          {/* Survey Links */}
          {surveyLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Available Surveys
                </CardTitle>
                <CardDescription>Direct survey links with instant rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {surveyLinks.map((survey) => (
                    <Card key={survey.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{survey.name}</h3>
                            {renderRating(survey.rating || 0)}
                          </div>
                          {survey.is_recommended && (
                            <Badge variant="default">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {survey.content || "Complete this survey to earn points"}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary">{survey.payout} pts</Badge>
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: survey.color_code || undefined,
                            }}
                            onClick={() => window.open(survey.link, "_blank")}
                          >
                            {survey.button_text || "Start Survey"}
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Survey Providers (Offerwalls) */}
          {providers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Offerwalls</CardTitle>
                <CardDescription>Complete offers from our partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((provider) => (
                    <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{provider.name}</h3>
                            {renderRating(provider.rating || 0)}
                          </div>
                          {provider.is_recommended && (
                            <Badge variant="default">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {provider.content || "Complete offers to earn points"}
                        </p>
                        <Button
                          className="w-full"
                          style={{
                            backgroundColor: provider.color_code || undefined,
                          }}
                        >
                          {provider.button_text || "Open Offers"}
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {surveyLinks.length === 0 && providers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No surveys available at the moment</p>
                <p className="text-sm">Check back later for new opportunities</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
