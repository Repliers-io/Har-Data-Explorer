import { useState, useEffect, useRef } from "react";
import { useGetHarShowings } from "@workspace/api-client-react";
import { defaultDateBegin, defaultDateEnd, formatCurrency } from "@/lib/date-utils";
import { ApiKeyError, isApiKeyError } from "@/components/shared/api-key-error";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, User, Phone, Building, FileText, MessageSquare, Loader2 } from "lucide-react";
import { ListingPhoto } from "@/components/shared/listing-photo";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

// Map API status codes to display labels and colors
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  CANCL: { label: "Cancelled",  className: "bg-red-100 text-red-800 border-red-200" },
  COMP:  { label: "Completed",  className: "bg-green-100 text-green-800 border-green-200" },
  SHOWED:{ label: "Showed",     className: "bg-green-100 text-green-800 border-green-200" },
  PEND:  { label: "Pending",    className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  SCHED: { label: "Scheduled",  className: "bg-blue-100 text-blue-800 border-blue-200" },
  APPRD: { label: "Approved",   className: "bg-blue-100 text-blue-800 border-blue-200" },
  CONFM: { label: "Confirmed",  className: "bg-blue-100 text-blue-800 border-blue-200" },
  DENY:  { label: "Denied",     className: "bg-red-100 text-red-800 border-red-200" },
  NOSHOW:{ label: "No Show",    className: "bg-orange-100 text-orange-800 border-orange-200" },
};

function showingStatus(code?: string) {
  if (!code) return { label: "Scheduled", className: "bg-blue-100 text-blue-800 border-blue-200" };
  return STATUS_MAP[code] ?? { label: code, className: "bg-blue-100 text-blue-800 border-blue-200" };
}

function formatShowingTime(startIso?: string, endIso?: string): { date: string; time: string; duration: string | null } {
  if (!startIso) return { date: "—", time: "", duration: null };
  try {
    const start = parseISO(startIso);
    const date = format(start, "MMM d, yyyy");
    const time = format(start, "h:mm a");
    if (!endIso) return { date, time, duration: null };
    const end = parseISO(endIso);
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return { date, time, duration: mins > 0 ? `${mins} min` : null };
  } catch {
    return { date: startIso, time: "", duration: null };
  }
}

const PAGE_SIZE = 50;

export default function ShowingsPage() {
  const [mlsSearch, setMlsSearch] = useState("");
  const debouncedMlsSearch = useDebounce(mlsSearch, 500);

  const [offset, setOffset] = useState(0);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const searchKeyRef = useRef(debouncedMlsSearch);

  // Reset pagination whenever the search changes
  useEffect(() => {
    searchKeyRef.current = debouncedMlsSearch;
    setOffset(0);
    setAllListings([]);
    setTotal(null);
  }, [debouncedMlsSearch]);

  const { data, isLoading, isFetching, error } = useGetHarShowings({
    dateBegin: defaultDateBegin,
    dateEnd: defaultDateEnd,
    mlsNumber: debouncedMlsSearch || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  // Append (or replace) listings as pages arrive
  useEffect(() => {
    if (!data?.data) return;
    setTotal(data.total);
    if (offset === 0) {
      setAllListings(data.data as any[]);
    } else {
      setAllListings((prev) => [...prev, ...(data.data as any[])]);
    }
  }, [data]);

  if (isApiKeyError(error)) return <ApiKeyError />;

  const formatAddress = (address?: any) => {
    if (!address) return "Unknown Address";
    return [address.streetNumber, address.streetDirection, address.streetName, address.streetSuffix]
      .filter(Boolean).join(" ") || "Unknown Address";
  };

  const hasMore = total !== null && allListings.length < total;
  const initialLoading = isLoading && offset === 0 && allListings.length === 0;
  const loadingMore = isFetching && offset > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Showings</h1>
          <p className="text-muted-foreground mt-1">ShowingSmart activity logs grouped by listing.</p>
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

      {/* Record count */}
      {total !== null && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{allListings.length.toLocaleString()}</span>{" "}
          of <span className="font-medium text-foreground">{total.toLocaleString()}</span> listings
        </p>
      )}

      <div className="space-y-8">
        {initialLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full mb-2" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : allListings.length > 0 ? (
          allListings.map((listing, index) => {
            const logs: any[] = listing.logs ?? [];
            return (
              <Card key={`${listing.mlsNumber}-${index}`} className="border-border overflow-hidden shadow-sm">
                {/* Listing header */}
                <div className="bg-muted/30 p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <ListingPhoto
                      images={listing.images}
                      className="w-14 h-14 rounded-md shadow-sm flex-shrink-0"
                      iconSize="w-6 h-6"
                    />
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-foreground">{formatAddress(listing.address)}</h2>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span>MLS: <span className="font-mono">{listing.mlsNumber}</span></span>
                        {listing.listPrice && <span>{formatCurrency(listing.listPrice)}</span>}
                      </div>
                      {/* List agent — pulled from first log since it's constant per listing */}
                      {logs[0]?.laAgentkey && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium text-foreground/80">List agent:</span>
                            {logs[0].laAgentkey}
                          </span>
                          {logs[0].laOfficeName && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {logs[0].laOfficeName}
                            </span>
                          )}
                          {logs[0].laCellPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {logs[0].laCellPhone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit text-sm flex-shrink-0">
                    {logs.length} {logs.length === 1 ? "Showing" : "Showings"}
                  </Badge>
                </div>

                {/* Log rows */}
                <div className="p-0">
                  {logs.length > 0 ? (
                    <div className="divide-y divide-border">
                      {logs.map((log, sIdx) => {
                        const { date, time, duration } = formatShowingTime(log.showingStartTime, log.showingEndTime);
                        const status = showingStatus(log.showingStatus);
                        const feedback = log.feedbackText || log.saComments;

                        return (
                          <div key={sIdx} className="p-4 md:p-6 hover:bg-muted/10 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                              {/* Time & Status */}
                              <div className="md:w-1/4 flex-shrink-0">
                                <Badge variant="outline" className={`text-xs font-semibold mb-2 ${status.className}`}>
                                  {status.label}
                                </Badge>
                                <div className="flex items-start gap-2 text-foreground font-medium">
                                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <div>{date}</div>
                                    <div className="text-sm font-normal text-muted-foreground">{time}</div>
                                    {duration && (
                                      <div className="text-xs text-muted-foreground mt-0.5">{duration}</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Showing Agent */}
                              <div className="md:w-1/3 flex-shrink-0 border-l border-border pl-4 md:pl-6">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                  Showing Agent
                                </h4>
                                {log.saAgentkey ? (
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex items-center gap-2 text-foreground font-medium">
                                      <User className="w-4 h-4 text-primary/70 flex-shrink-0" />
                                      {log.saAgentkey}
                                    </div>
                                    {log.saOfficeName && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building className="w-4 h-4 flex-shrink-0" />
                                        {log.saOfficeName}
                                      </div>
                                    )}
                                    {log.saCellPhone && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4 flex-shrink-0" />
                                        {log.saCellPhone}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">No agent details</span>
                                )}
                              </div>

                              {/* Feedback / Comments */}
                              <div className="flex-1 bg-muted/30 p-4 rounded-lg border border-border/50">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                  {log.feedbackText
                                    ? <><FileText className="w-3 h-3" /> Feedback</>
                                    : <><MessageSquare className="w-3 h-3" /> Comments</>
                                  }
                                </div>
                                {feedback ? (
                                  <p className="text-sm text-foreground/90 italic">"{feedback}"</p>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No feedback provided yet.</p>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No showing logs recorded for this listing in the selected period.
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        ) : !isFetching ? (
          <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">No showings found</h3>
            <p className="text-muted-foreground">There are no ShowingSmart logs for this period.</p>
          </div>
        ) : null}

        {/* Skeleton cards while loading more */}
        {loadingMore &&
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={`loading-more-${i}`} className="border-border">
              <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full mb-2" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Load more button */}
      {hasMore && !isFetching && (
        <div className="flex justify-center pt-2 pb-6">
          <Button
            variant="outline"
            onClick={() => setOffset(allListings.length)}
            disabled={isFetching}
          >
            Load more
            <span className="ml-1.5 text-muted-foreground text-xs">
              ({(total! - allListings.length).toLocaleString()} remaining)
            </span>
          </Button>
        </div>
      )}
      {isFetching && offset > 0 && (
        <div className="flex justify-center pt-2 pb-6">
          <Button variant="outline" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading…
          </Button>
        </div>
      )}
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
