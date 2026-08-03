import { useState, useEffect } from "react";
import { useGetHarShowings } from "@workspace/api-client-react";
import { defaultDateBegin, defaultDateEnd, formatDateTime, formatCurrency } from "@/lib/date-utils";
import { ApiKeyError, isApiKeyError } from "@/components/shared/api-key-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Clock, User, Phone, Mail, Building, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ShowingsPage() {
  const [mlsSearch, setMlsSearch] = useState("");
  const debouncedMlsSearch = useDebounce(mlsSearch, 500);

  const { data, isLoading, error } = useGetHarShowings({
    dateBegin: defaultDateBegin,
    dateEnd: defaultDateEnd,
    mlsNumber: debouncedMlsSearch || undefined
  });

  if (isApiKeyError(error)) {
    return <ApiKeyError />;
  }

  const formatAddress = (address?: any) => {
    if (!address) return "Unknown Address";
    const parts = [
      address.streetNumber,
      address.streetDirection,
      address.streetName,
      address.streetSuffix
    ].filter(Boolean);
    return parts.join(" ") || "Unknown Address";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Showings</h1>
          <p className="text-muted-foreground mt-1">
            ShowingSmart activity logs grouped by listing.
          </p>
        </div>
        <div className="w-full md:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search MLS number..."
            value={mlsSearch}
            onChange={(e) => setMlsSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      <div className="space-y-8">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full mb-2" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((listing, index) => (
            <Card key={`${listing.mlsNumber}-${index}`} className="border-border overflow-hidden shadow-sm">
              <div className="bg-muted/30 p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-background border border-border p-2 rounded-md shadow-sm">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {formatAddress(listing.address)}
                    </h2>
                    <div className="text-sm text-muted-foreground flex gap-3 mt-0.5">
                      <span>MLS: <span className="font-mono">{listing.mlsNumber}</span></span>
                      {listing.listPrice && <span>{formatCurrency(listing.listPrice)}</span>}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit text-sm">
                  {listing.showings?.length || 0} Showings
                </Badge>
              </div>
              
              <div className="p-0">
                {listing.showings && listing.showings.length > 0 ? (
                  <div className="divide-y divide-border">
                    {listing.showings.map((showing, sIdx) => (
                      <div key={sIdx} className="p-4 md:p-6 hover:bg-muted/10 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          
                          {/* Time & Status */}
                          <div className="md:w-1/4 flex-shrink-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-semibold capitalize ${
                                  showing.status?.toLowerCase() === 'completed' || showing.status?.toLowerCase() === 'showed' 
                                    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                    : showing.status?.toLowerCase() === 'cancelled' || showing.status?.toLowerCase() === 'canceled'
                                    ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                    : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                }`}
                              >
                                {showing.status || 'Scheduled'}
                              </Badge>
                            </div>
                            <div className="flex items-start gap-2 text-foreground font-medium">
                              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                              <div>
                                {formatDateTime(showing.showingDate, showing.showingTime)}
                                {showing.duration && (
                                  <div className="text-xs font-normal text-muted-foreground mt-0.5">
                                    Duration: {showing.duration} mins
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Agent Info */}
                          <div className="md:w-1/3 flex-shrink-0 border-l border-border pl-4 md:pl-6">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Showing Agent</h4>
                            {showing.buyerAgent ? (
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                  <User className="w-4 h-4 text-primary/70" />
                                  {showing.buyerAgent.agentName || 'Unknown Agent'}
                                </div>
                                {showing.buyerAgent.officeName && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building className="w-4 h-4" />
                                    {showing.buyerAgent.officeName}
                                  </div>
                                )}
                                {showing.buyerAgent.agentPhone && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    {showing.buyerAgent.agentPhone}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">No agent details</span>
                            )}
                          </div>

                          {/* Feedback */}
                          <div className="flex-1 bg-muted/30 p-4 rounded-lg border border-border/50 h-full">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              <FileText className="w-3 h-3" />
                              Feedback
                            </div>
                            {showing.feedback ? (
                              <p className="text-sm text-foreground/90 italic">
                                "{showing.feedback}"
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No feedback provided yet.
                              </p>
                            )}
                          </div>
                          
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No showing logs recorded for this listing in the selected period.
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">No showings found</h3>
            <p className="text-muted-foreground">There are no ShowingSmart logs for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
