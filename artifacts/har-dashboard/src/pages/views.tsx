import { useState, useEffect } from "react";
import { useGetHarViews } from "@workspace/api-client-react";
import { defaultDateBegin, defaultDateEnd, formatCurrency, formatDate } from "@/lib/date-utils";
import { ApiKeyError, isApiKeyError } from "@/components/shared/api-key-error";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Smartphone, Globe } from "lucide-react";
import { ListingPhoto } from "@/components/shared/listing-photo";
import { Badge } from "@/components/ui/badge";

export default function ViewsPage() {
  const [mlsSearch, setMlsSearch] = useState("");
  const debouncedMlsSearch = useDebounce(mlsSearch, 500);

  const { data, isLoading, error } = useGetHarViews({
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((record, index) => {
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
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No listing views found for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
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
