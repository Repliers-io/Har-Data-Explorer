import { useGetHarReviews } from "@workspace/api-client-react";
import { defaultDateBegin, defaultDateEnd, formatDate } from "@/lib/date-utils";
import { ApiKeyError, isApiKeyError } from "@/components/shared/api-key-error";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquareQuote, CalendarCheck, User } from "lucide-react";
import { ListingPhoto } from "@/components/shared/listing-photo";

const ROLE_LABEL: Record<string, string> = {
  list:       "List Agent",
  sell:       "Sell Agent",
  buyer:      "Buyer Agent",
  seller:     "Seller Agent",
  listorsell: "List / Sell Agent",
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

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border">
              <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
                <Skeleton className="w-14 h-14 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          ))
        ) : data?.data && data.data.length > 0 ? (
          (data.data as any[]).map((review, i) => {
            const roleLabel = ROLE_LABEL[review.transactionType?.toLowerCase()] ?? review.transactionType ?? "Agent";
            return (
              <Card key={`${review.mlsNumber}-${i}`} className="overflow-hidden border-border shadow-sm">

                {/* Header — same pattern as showings */}
                <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-3">
                  <ListingPhoto
                    images={review.images}
                    className="w-14 h-14 rounded-md shadow-sm flex-shrink-0"
                    iconSize="w-6 h-6"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {formatAddress(review.address)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      MLS: {review.mlsNumber}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-xs">
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
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <CalendarCheck className="w-3 h-3" />
                      Closed {formatDate(review.closedDate)}
                    </div>
                  </div>
                </div>

                {/* Review body */}
                <div className="p-5 space-y-4">
                  {/* Stars + score + client + sub-scores */}
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating score={review.score || 0} />
                    <span className="font-bold text-xl font-mono">{review.score?.toFixed(1) ?? "—"}</span>
                    <span className="text-sm font-medium text-foreground/80">
                      {review.clientName || "Anonymous Client"}
                    </span>
                    <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                      {[
                        ["Competency",    review.competency],
                        ["Knowledge",     review.knowledge],
                        ["Communication", review.communication],
                      ].map(([label, val]) => (
                        <span key={label as string}>
                          {label}{" "}
                          <span className="font-semibold text-foreground font-mono">{val ?? "—"}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="relative pl-5">
                    <MessageSquareQuote className="absolute top-0 left-0 w-4 h-4 text-primary/20 rotate-180 mt-0.5" />
                    <p className="text-sm italic text-foreground/80 leading-relaxed">
                      {review.comments || "No written comments provided."}
                    </p>
                  </div>

                  {/* Agent response */}
                  {review.agentComment && (
                    <div className="bg-muted/40 px-4 py-3 rounded-lg border border-border/50">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Your Response</div>
                      <p className="text-sm text-muted-foreground">{review.agentComment}</p>
                    </div>
                  )}
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
  const full = Math.floor(score);
  const half = score % 1 >= 0.5;
  return (
    <div className="flex text-primary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < full ? "fill-primary text-primary"
            : i === full && half ? "fill-primary/50 text-primary"
            : "text-primary/25"
          }`}
        />
      ))}
    </div>
  );
}
