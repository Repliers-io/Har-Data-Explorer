import { AlertCircle, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ApiKeyError() {
  return (
    <div className="flex w-full items-center justify-center p-8 min-h-[50vh]">
      <Card className="max-w-md w-full border-primary/20 bg-primary/5 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl text-primary">API Key Required</CardTitle>
          <CardDescription className="text-base text-foreground/80 mt-2">
            Your Repliers API key is not yet configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-foreground/70">
          <p>
            Add <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary">REPLIERS_API_KEY</code> to your environment variables to see your HAR.com data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function isApiKeyError(error: any): boolean {
  if (!error) return false;
  
  // Status check
  if (error.status === 401) return true;
  
  // Checking the structure Orval/customFetch might return
  const msg = error.message || error.error || (error.response?.data?.error) || "";
  if (typeof msg === 'string' && msg.toLowerCase().includes("api key")) return true;
  if (typeof msg === 'string' && msg.toLowerCase().includes("unauthorized")) return true;
  
  return false;
}
