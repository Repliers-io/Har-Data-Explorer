import { useGetHarReviews } from "@workspace/api-client-react";
import { defaultDateBegin, defaultDateEnd, formatDate } from "@/lib/date-utils";
import { ApiKeyError, isApiKeyError } from "@/components/shared/api-key-error";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquareQuote, CalendarCheck, User } from "lucide-react";
import { ListingPhoto } from "@/components/shared/listing-photo";

const ROLE_LABEL: Record<string, string> = {
  list:        "List Agent",
  sell:        "Sell Agent",
  buyer:       "Buyer Agent",
  seller:      "Seller Agent",
  listorsell:  "List / Sell Agent",
};

export default function ReviewsPage() {
  const { data, isLoading, error } = useGetHarReviews({
    dateBegin: defaultDateBegin,
    dateEnd: defaultDateEnd,
  });

  if (isApiKeyError(error)) return <ApiKeyError />;

  const formatAddress = (address?: any) => {
    if (!address) return "Unknown Property";
    return [address.streetNumber, address.streetDirection, address.streetName, address.streetSuffix]
      .filter(Boolean).join(" ") || "Unknown Property";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Client Reviews</h1>
        <p className="text-muted-foreground mt-1">Feedback from your closed transactions.</p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border">
              <Skeleton className="h-32 w-full" />
              <div className="p-6"><Skeleton className="h-20 w-full" /></div>
            </Card>
          ))
        ) : data?.data && data.data.length > 0 ? (
          (data.data as any[]).map((review, i) => {
            const roleLabel = ROLE_LABEL[review.transactionType?.toLowerCase()] ?? review.transactionType ?? "Agent";
            return (
              <Card key={`${review.mlsNumber}-${i}`} className="overflow-hidden border-border shadow-sm">

                {/* Cover photo strip + property meta */}
                <div className="flex items-stretch border-b border-border">
                  <ListingPhoto
                    images={review.images}
                    className="w-28 h-28 flex-shrink-0"
                    iconSize="w-7 h-7"
                  />
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="font-semibold text-foreground truncate">
                        {formatAddress(review.address)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        MLS: {review.mlsNumber}
                      </div>
                    </div>
                    {/* Agent row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs font-medium capitalize">
                        {roleLabel}
                      </Badge>
                      {review.agentkey && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span className="font-medium text-foreground/80">{review.agentkey}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Closed date */}
                  <div className="flex-shrink-0 p-4 text-right flex flex-col items-end justify-between">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3" />
                      Closed {formatDate(review.closedDate)}
                    </div>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {review.transactionType?.replace("_", " ") || "Transaction"}
                    </Badge>
                  </div>
                </div>

                {/* Score + quote */}
                <div className="flex flex-col md:flex-row">
                  {/* Left: score panel */}
                  <div className="bg-secondary/30 p-5 md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col gap-4">
                    <div>
                      <StarRating score={review.score || 0} />
                      <div className="font-bold text-2xl mt-1">{review.score?.toFixed(1) || "N/A"}</div>
                      <div className="text-sm font-medium text-foreground mt-1">
                        {review.clientName || "Anonymous Client"}
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5 text-muted-foreground border-t border-border/50 pt-3">
                      {[
                        ["Competency",     review.competency],
                        ["Knowledge",      review.knowledge],
                        ["Communication",  review.communication],
                      ].map(([label, val]) => (
                        <div key={label as string} className="flex justify-between">
                          <span>{label}</span>
                          <span className="font-mono text-foreground font-medium">{val ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: quote + agent response */}
                  <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                    <div className="relative">
                      <MessageSquareQuote className="absolute -top-1 -left-2 w-7 h-7 text-primary/10 rotate-180" />
                      <p className="text-foreground/90 italic pl-5 leading-relaxed text-sm">
                        "{review.comments || "No written comments provided."}"
                      </p>
                    </div>
                    {review.agentComment && (
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Your Response</div>
                        <p className="text-sm text-muted-foreground">{review.agentComment}</p>
                      </div>
                    )}
                  </div>
                </div>

              </Card>
            );
          })
        ) : (
          <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card">
            <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">No reviews found</h3>
            <p className="text-muted-foreground">There are no client reviews for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score);
  const hasHalf = score % 1 >= 0.5;
  return (
    <div className="flex text-primary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < fullStars
              ? "fill-primary text-primary"
              : i === fullStars && hasHalf
              ? "fill-primary/50 text-primary"
              : "text-primary/30"
          }`}
        />
      ))}
    </div>
  );
}
