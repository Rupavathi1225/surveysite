import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Star,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
} from "lucide-react";

interface Offer {
  offer_id: string;
  title: string;
  description: string | null;
  payout: number;
  currency: string | null;
  url: string;
  image_url: string | null;
  platform: string | null;
  device: string | null;
  devices: string[] | null;
  country: string[] | null;
  vertical: string | null;
  is_active: boolean | null;
}

interface SurveyProvider {
  id: string;
  name: string;
  code: string;
  iframe_code: string | null;
  content: string | null;
  rating: number | null;
  is_recommended: boolean | null;
  color_code: string | null;
  button_text: string | null;
  image_url: string | null;
  point_percentage: number | null;
}

export default function DailySurveys() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [providers, setProviders] = useState<SurveyProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [offersRes, providersRes] = await Promise.all([
      supabase.from("offers").select("*").eq("is_active", true),
      supabase.from("survey_providers").select("*").eq("status", "active"),
    ]);

    if (offersRes.data) setOffers(offersRes.data);
    if (providersRes.data) setProviders(providersRes.data);
    setIsLoading(false);
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case "desktop":
        return <Monitor className="h-3.5 w-3.5" />;
      case "mobile":
        return <Smartphone className="h-3.5 w-3.5" />;
      case "tablet":
        return <Tablet className="h-3.5 w-3.5" />;
      default:
        return <Globe className="h-3.5 w-3.5" />;
    }
  };

  const renderDeviceIcons = (offer: Offer) => {
    const devices = offer.devices || (offer.device ? [offer.device] : []);
    if (devices.length === 0) return <Globe className="h-3.5 w-3.5 text-muted-foreground" />;
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        {devices.map((d, i) => (
          <span key={i}>{getDeviceIcon(d)}</span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Earn</h1>
        <p className="text-muted-foreground">Complete tasks and offers to earn rewards</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Featured Tasks (Offers) */}
          {offers.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold">Featured Tasks</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Featured tasks are the best tasks to complete, with the highest rewards
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {offers.map((offer) => (
                  <div
                    key={offer.offer_id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedOffer(offer)}
                  >
                    <div className="rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg">
                      {/* Image */}
                      <div className="aspect-square bg-secondary flex items-center justify-center overflow-hidden">
                        {offer.image_url ? (
                          <img
                            src={offer.image_url}
                            alt={offer.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ClipboardList className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3 space-y-1">
                        <h3 className="font-semibold text-sm truncate">{offer.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {offer.description || "Complete this task to earn"}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-primary font-bold text-sm">
                            $ {offer.payout.toFixed(2)}
                          </span>
                          {renderDeviceIcons(offer)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Offer Walls (Survey Providers) */}
          {providers.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold">Offer Walls</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Each offer wall contains hundreds of offers to complete
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="relative rounded-lg border border-border bg-card hover:border-primary/50 transition-all overflow-hidden cursor-pointer group"
                  >
                    {provider.point_percentage && provider.point_percentage > 0 && (
                      <Badge className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                        +{provider.point_percentage}%
                      </Badge>
                    )}
                    <div className="h-24 flex items-center justify-center bg-secondary p-4">
                      {provider.image_url ? (
                        <img
                          src={provider.image_url}
                          alt={provider.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-lg font-bold text-foreground">{provider.name}</span>
                      )}
                    </div>
                    <div className="p-2 text-center">
                      <p className="text-sm font-medium truncate">{provider.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {offers.length === 0 && providers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tasks available at the moment</p>
                <p className="text-sm">Check back later for new opportunities</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Offer Detail Modal */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Task</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              {/* Offer header */}
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {selectedOffer.image_url ? (
                    <img
                      src={selectedOffer.image_url}
                      alt={selectedOffer.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{selectedOffer.title}</h3>
                      <p className="text-primary font-bold text-base">
                        $ {selectedOffer.payout.toFixed(2)}
                      </p>
                    </div>
                    {renderDeviceIcons(selectedOffer)}
                  </div>
                </div>
              </div>

              {/* Category & Provider */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium text-sm">{selectedOffer.vertical || "General"}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Platform</p>
                  <p className="font-medium text-sm">{selectedOffer.platform || "All"}</p>
                </div>
              </div>

              {/* Description */}
              {selectedOffer.description && (
                <div>
                  <h4 className="font-semibold mb-1">Description</h4>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">{selectedOffer.description}</p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <Button
                className="w-full"
                size="lg"
                onClick={() => window.open(selectedOffer.url, "_blank")}
              >
                Sign Up
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
