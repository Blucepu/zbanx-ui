"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/registry/zbanx/ui/badge";

export type RawQuoteSource =
  | "price_impressions"
  | "price_no_impressions"
  | "submit_quotation"
  | "quotation"
  | "estimate";

export const DEFAULT_QUOTE_SOURCE: RawQuoteSource = "estimate";

export const RAW_QUOTE_SOURCE_LABELS: Record<RawQuoteSource, string> = {
  price_impressions: "真实合作（有曝光）",
  price_no_impressions: "真实合作（无曝光）",
  submit_quotation: "提报报价",
  quotation: "达人报价",
  estimate: "预估报价",
};

export const RAW_QUOTE_SOURCE_BADGE_CLASS_NAMES: Record<
  RawQuoteSource,
  string
> = {
  price_impressions: "border-transparent bg-primary text-primary-foreground",
  price_no_impressions: "border-transparent bg-primary text-primary-foreground",
  submit_quotation: "border-transparent bg-primary/50 text-primary-foreground",
  quotation: "border-transparent bg-primary/50 text-primary-foreground",
  estimate: "border-transparent bg-secondary text-secondary-foreground",
};

export function normalizeQuoteSource(source?: string | null): RawQuoteSource {
  const normalized = (source ?? "").trim();
  return (Object.keys(RAW_QUOTE_SOURCE_LABELS) as RawQuoteSource[]).includes(
    normalized as RawQuoteSource
  )
    ? (normalized as RawQuoteSource)
    : DEFAULT_QUOTE_SOURCE;
}

interface QuoteSourceBadgeProps {
  source?: string | null;
  stale?: boolean;
  className?: string;
}

export function QuoteSourceBadge({
  source,
  stale = false,
  className,
}: QuoteSourceBadgeProps) {
  const normalized = normalizeQuoteSource(source);
  return (
    <span
      className={cn("flex min-h-5 flex-wrap items-center gap-1", className)}
    >
      <Badge
        variant="secondary"
        className={cn(RAW_QUOTE_SOURCE_BADGE_CLASS_NAMES[normalized])}
      >
        {RAW_QUOTE_SOURCE_LABELS[normalized]}
      </Badge>
      {stale && (
        <span className="rounded-sm border border-amber-500/40 px-1 text-[10px] text-amber-600 dark:text-amber-500">
          超2年
        </span>
      )}
    </span>
  );
}

export default QuoteSourceBadge;
