import { useState, useEffect, useRef } from "react";
import { useGetHarViews } from "@workspace/api-client-react";
import type { HarViewRecord } from "@workspace/api-client-react";
import { defaultDateBegin, defaultDateEnd, formatCurrency, formatDate } from "@/lib/date-utils";
import { ApiKeyError, isApiKeyError } from "@/components/shared/api-key-error";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Smartphone, Globe, User, Loader2 } from "lucide-react";
import { ListingPhoto } from "@/components/shared/listing-photo";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 50;

export default function ViewsPage() {
  const [mlsSearch, setMlsSearch] = useState("");
  const debouncedMlsSearch = useDebounce(mlsSearch, 500);

  const [offset, setOffset] = useState(0);
  const [allRecords, setAllRecords] = useState<HarViewRecord[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  // track which search the current allRecords belong to
  const searchKeyRef = useRef(debouncedMlsSearch);

  // Reset pagination whenever the search changes
  useEffect(() => {
    searchKeyRef.current = debouncedMlsSearch;
    setOffset(0);
    setAllRecords([]);
    setTotal(null);
  }, [debouncedMlsSearch]);

  const { data, isLoading, isFetching, error } = useGetHarViews({
    dateBegin: defaultDateBegin,
    dateEnd: defaultDateEnd,
    mlsNumber: debouncedMlsSearch || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  // Append (or replace) records as pages arrive
  useEffect(() => {
    if (!data?.data) return;
    setTotal(data.total);
    if (offset === 0) {
      setAllRecords(data.data);
    } else {
      setAllRecords((prev) => [...prev, ...data.data]);
    }
  }, [data]);

  if (isApiKeyError(error)) {
    return <ApiKeyError />;
  }

  const formatAddress = (address?: any) => {
    if (!address) return "Unknown Address";
    const parts = [
      address.streetNumber,
      address.streetDirection,
      address.streetName,
      address.streetSuffix,
    ].filter(Boolean);
    return parts.join(" ") || "Unknown Address";
  };

  const hasMore = total !== null && allRecords.length < total;
  const initialLoading = isLoading && offset === 0 && allRecords.length === 0;
  const loadingMore = isFetching && offset > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Listing Views</h1>
          <p className="text-muted-foreground mt-1">
            Track daily web and mobile traffic for your active listings.
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

      {/* Record count */}
      {total !== null && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{allRecords.length.toLocaleString()}</span>{" "}
          of <span className="font-medium text-foreground">{total.toLocaleString()}</span> records
        </p>
      )}

      <Card className="overflow-hidden border-border shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[300px]">Property</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Web Views</TableHead>
              <TableHead className="text-right">Mobile Views</TableHead>
              <TableHead className="text-right">Total Traffic</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : allRecords.length > 0 ? (
              allRecords.map((record, index) => {
                const addressStr = formatAddress(record.address);
                const total = (record.webView || 0) + (record.mobileView || 0);

                return (
                  <TableRow
                    key={`${record.mlsNumber}-${record.dateTracked}-${index}`}
                    className="group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ListingPhoto
                          images={(record as any).images}
                          className="w-10 h-10 rounded flex-shrink-0 shadow-sm"
                        />
                        <div>
                          <div className="font-semibold text-foreground truncate max-w-[200px]">
                            {addressStr}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>MLS: {record.mlsNumber}</span>
                            {record.listPrice && (
                              <>
                                <span>•</span>
                                <span>{formatCurrency(record.listPrice)}</span>
                              </>
                            )}
                          </div>
                          {(record as any).laAgentkey && (
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="font-medium text-foreground/70">{(record as any).laAgentkey}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatDate(record.dateTracked)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div className="flex items-center justify-end gap-2">
                        {record.webView || 0}
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div className="flex items-center justify-end gap-2">
                        {record.mobileView || 0}
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono text-sm px-2.5 py-0.5">
                        <Eye className="h-3 w-3 mr-1" />
                        {total}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : !isFetching ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No listing views found for this period.
                </TableCell>
              </TableRow>
            ) : null}

            {/* Skeleton rows while loading more */}
            {loadingMore &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`loading-more-${i}`}>
                  <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      {/* Load more button */}
      {hasMore && !isFetching && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setOffset(allRecords.length)}
            disabled={isFetching}
          >
            Load more
            <span className="ml-1.5 text-muted-foreground text-xs">
              ({(total! - allRecords.length).toLocaleString()} remaining)
            </span>
          </Button>
        </div>
      )}
      {isFetching && offset > 0 && (
        <div className="flex justify-center pt-2">
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
