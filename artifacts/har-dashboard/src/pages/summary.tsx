import { useGetHarSummary } from "@workspace/api-client-react";
import { defaultDateBegin, defaultDateEnd, formatScore } from "@/lib/date-utils";
import { ApiKeyError, isApiKeyError } from "@/components/shared/api-key-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Smartphone, Star, CalendarDays, Building, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SummaryPage() {
  const { data, isLoading, error } = useGetHarSummary({
    dateBegin: defaultDateBegin,
    dateEnd: defaultDateEnd
  });

  if (isApiKeyError(error)) {
    return <ApiKeyError />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">
          Your HAR.com performance over the last 30 days.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Web Views" 
          value={data?.totalWebViews} 
          icon={Eye} 
          isLoading={isLoading} 
          description={`${data?.uniqueListingsWithViews || 0} listings with views`}
        />
        <StatCard 
          title="Mobile Views" 
          value={data?.totalMobileViews} 
          icon={Smartphone} 
          isLoading={isLoading} 
          description="Via HAR.com app"
        />
        <StatCard 
          title="Avg Review Score" 
          value={data?.averageReviewScore !== undefined ? formatScore(data.averageReviewScore) : undefined} 
          icon={Star} 
          isLoading={isLoading} 
          description={`${data?.totalReviews || 0} total reviews`}
        />
        <StatCard 
          title="Total Showings" 
          value={data?.totalShowings} 
          icon={CalendarDays} 
          isLoading={isLoading} 
          description={`${data?.uniqueListingsWithShowings || 0} listings shown`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="w-5 h-5 mr-2 text-primary" />
              Listing Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <div className="text-sm font-medium text-muted-foreground">Unique Listings with Views</div>
                  <div className="text-2xl font-bold font-mono">{data?.uniqueListingsWithViews || 0}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Unique Listings with Showings</div>
                  <div className="text-2xl font-bold font-mono">{data?.uniqueListingsWithShowings || 0}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="col-span-1 bg-secondary rounded-xl p-8 text-secondary-foreground flex flex-col justify-center items-start shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 text-secondary-foreground/10">
            <Building className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Know Your Numbers</h3>
            <p className="text-secondary-foreground/80 mb-6 max-w-sm">
              Use these insights to have informed conversations with your clients about their property's market performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  isLoading,
  description
}: { 
  title: string; 
  value?: number | string; 
  icon: any; 
  isLoading: boolean;
  description?: string;
}) {
  return (
    <Card className="overflow-hidden border-border shadow-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
            {value ?? "—"}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
