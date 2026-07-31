import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  reviewCount?: number;
  size?: number;
  className?: string;
}

export function Rating({ value, reviewCount, size = 14, className }: RatingProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="img" aria-label={`Ocena ${value.toFixed(1)} na 5`}>
      <Star size={size} className="fill-accent-500 text-accent-500" aria-hidden="true" />
      <span className="text-sm font-semibold text-graphite-900">{value.toFixed(1)}</span>
      {typeof reviewCount === "number" && (
        <span className="text-sm text-graphite-500">({reviewCount})</span>
      )}
    </div>
  );
}
