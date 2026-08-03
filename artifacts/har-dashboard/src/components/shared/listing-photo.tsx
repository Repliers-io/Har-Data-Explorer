import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const CDN_BASE = "https://cdn.repliers.io/";

interface ListingPhotoProps {
  images?: string[];
  className?: string;
  iconSize?: string;
}

export function ListingPhoto({ images, className, iconSize = "h-4 w-4" }: ListingPhotoProps) {
  const [failed, setFailed] = useState(false);
  const src = images?.[0] ? `${CDN_BASE}${images[0]}` : null;

  if (!src || failed) {
    return (
      <div className={cn("bg-secondary flex items-center justify-center text-secondary-foreground border border-border", className)}>
        <MapPin className={cn(iconSize, "opacity-40 text-primary")} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Listing cover"
      onError={() => setFailed(true)}
      className={cn("object-cover bg-muted", className)}
    />
  );
}
