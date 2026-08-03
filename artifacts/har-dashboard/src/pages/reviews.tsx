import { useState, useEffect } from "react";
import { useGetHarReviews } from "@workspace/api-client-react";
import { defaultDateBegin, defaultDateEnd, formatDate } from "@/lib/date-utils";
import { ApiKeyError, isApiKeyError } from "@/components/shared/api-key-error";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquareQuote, CalendarCheck, Home } from "lucide-react";

export default function ReviewsPage() {
  const { data, isLoading, error } = useGetHarReviews({
    dateBegin: defaultDateBegin,
    dateEnd: defaultDateEnd
  });

  if (isApiKeyError(error)) {
    return <ApiKeyError />;
  }

  const formatAddress = (address?: any) => {
    if (!address) return "Unknown Property";
    const parts = [
      address.streetNumber,
      address.streetDirection,
      address.streetName,
      address.streetSuffix
    ].filter(Boolean);
    return parts.join(" ") || "Unknown Property";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Client Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Feedback from your closed transactions.
        </p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-3"><Skeleton className="h-6 w-1/3" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((review, i) => (
            <Card key={`${review.mlsNumber}-${i}`} className="overflow-hidden border-border shadow-sm group">
              <div className="flex flex-col md:flex-row">
                <div className="bg-secondary/30 p-6 md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border">
                  <div className="flex flex-col h-full justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating score={review.score || 0} />
                      </div>
                      <div className="font-bold text-xl">{review.score?.toFixed(1) || "N/A"}</div>
                      <div className="text-sm font-medium text-foreground mt-1">
                        {review.clientName || "Anonymous Client"}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Competency</span>
                          <span className="font-mono text-foreground font-medium">{review.competency || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Knowledge</span>
                          <span className="font-mono text-foreground font-medium">{review.knowledge || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Communication</span>
                          <span className="font-mono text-foreground font-medium">{review.communication || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
                    <Badge variant="outline" className="bg-card">
                      <Home className="w-3 h-3 mr-1" />
                      {formatAddress(review.address)}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {review.transactionType?.replace('_', ' ') || "Transaction"}
                    </Badge>
                    <div className="text-xs text-muted-foreground flex items-center ml-auto">
                      <CalendarCheck className="w-3 h-3 mr-1" />
                      Closed: {formatDate(review.closedDate)}
                    </div>
                  </div>

                  <div className="relative">
                    <MessageSquareQuote className="absolute -top-1 -left-2 w-8 h-8 text-primary/10 rotate-180" />
                    <p className="text-foreground/90 italic pl-6 relative z-10 leading-relaxed">
                      "{review.comments || "No written comments provided."}"
                    </p>
                  </div>

                  {review.agentComment && (
                    <div className="mt-6 bg-muted/30 p-4 rounded-lg border border-border/50">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Your Response</div>
                      <p className="text-sm text-muted-foreground">
                        {review.agentComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
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
  const hasHalfStar = score % 1 >= 0.5;
  
  return (
    <div className="flex text-primary">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className="w-4 h-4 fill-primary text-primary" />;
        }
        // Assuming no half-star icon in lucide-react without custom SVG, 
        // we'll just use a filled star with reduced opacity for partial
        if (i === fullStars && hasHalfStar) {
          return <Star key={i} className="w-4 h-4 fill-primary/50 text-primary" />;
        }
        return <Star key={i} className="w-4 h-4 text-primary/30" />;
      })}
    </div>
  );
}
