import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, ExternalLink, Search, Filter, Globe, DollarSign } from "lucide-react";

interface Offer {
  offer_id: string;
  title: string;
  url: string;
  country: string[] | null;
  payout: number;
  description: string | null;
  platform: string | null;
  preview_url: string | null;
  vertical: string | null;
  device: string | null;
  image_url: string | null;
  devices: string[] | null;
  payout_model: string | null;
  currency: string | null;
  is_active: boolean | null;
}

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchQuery, countryFilter, platformFilter]);

  const fetchOffers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .order("payout", { ascending: false });

    if (data) {
      setOffers(data);
      setFilteredOffers(data);
    }
    if (error) console.error("Failed to fetch offers:", error);
    setIsLoading(false);
  };

  const filterOffers = () => {
    let filtered = [...offers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (offer) =>
          offer.title.toLowerCase().includes(query) ||
          offer.description?.toLowerCase().includes(query) ||
          offer.vertical?.toLowerCase().includes(query)
      );
    }

    // Country filter
    if (countryFilter !== "all") {
      filtered = filtered.filter(
        (offer) => offer.country?.includes(countryFilter)
      );
    }

    // Platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter(
        (offer) => offer.platform?.toLowerCase() === platformFilter.toLowerCase()
      );
    }

    setFilteredOffers(filtered);
  };

  // Get unique countries from all offers
  const allCountries = Array.from(
    new Set(offers.flatMap((o) => o.country || []).filter(Boolean))
  ).sort();

  // Get unique platforms
  const allPlatforms = Array.from(
    new Set(offers.map((o) => o.platform).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Offers</h1>
        <p className="text-muted-foreground">Complete offers to earn rewards</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {allCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {allPlatforms.map((platform) => (
                  <SelectItem key={platform} value={platform!}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offers Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No offers found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer) => (
            <Card key={offer.offer_id} className="flex flex-col hover:shadow-lg transition-shadow">
              {offer.image_url && (
                <div className="h-32 bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={offer.image_url}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{offer.title}</CardTitle>
                  <Badge className="shrink-0 bg-primary">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {offer.currency || "USD"} {offer.payout}
                  </Badge>
                </div>
                {offer.description && (
                  <CardDescription className="line-clamp-2">
                    {offer.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex flex-wrap gap-1 mb-3">
                  {offer.vertical && (
                    <Badge variant="secondary" className="text-xs">
                      {offer.vertical}
                    </Badge>
                  )}
                  {offer.platform && (
                    <Badge variant="outline" className="text-xs">
                      {offer.platform}
                    </Badge>
                  )}
                  {offer.payout_model && (
                    <Badge variant="outline" className="text-xs">
                      {offer.payout_model}
                    </Badge>
                  )}
                </div>
                {offer.country && offer.country.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    <Globe className="inline h-3 w-3 mr-1" />
                    {offer.country.slice(0, 3).join(", ")}
                    {offer.country.length > 3 && ` +${offer.country.length - 3} more`}
                  </p>
                )}
                <div className="mt-auto">
                  <Button asChild className="w-full">
                    <a href={offer.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Start Offer
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {!isLoading && filteredOffers.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredOffers.length} of {offers.length} offers
        </p>
      )}
    </div>
  );
}