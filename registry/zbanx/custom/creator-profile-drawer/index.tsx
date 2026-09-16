"use client";

import { CircleHelp, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import CountryFlag from "@/registry/zbanx/custom/country-flag";
import {
  formatMetric,
  formatVideoDate,
} from "@/registry/zbanx/custom/creator-list-item/format";
import {
  type CreatorMetricTip,
  getCreatorMetricTip,
  normalizeCreatorPlatform,
} from "@/registry/zbanx/custom/creator-list-item/metric-tips";
import type { CreatorChannelLite } from "@/registry/zbanx/custom/creator-list-item/types";
import { TagList } from "@/registry/zbanx/custom/tag-list";
import { VideoCover } from "@/registry/zbanx/custom/video-cover";
import { buttonVariants } from "@/registry/zbanx/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/registry/zbanx/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/zbanx/ui/tooltip";
import { getAbsoluteUrl } from "@/lib/link/index";

interface CreatorProfileDrawerProps {
  channel: (CreatorChannelLite & { updatedAgo?: string }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderPlatformIcon?: (platform: string) => ReactNode;
  renderExtra?: (channel: CreatorChannelLite) => ReactNode;
}

function InfoField({
  label,
  children,
  tip,
  platform,
}: {
  label: string;
  children: React.ReactNode;
  tip?: CreatorMetricTip;
  platform?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
        {label}
        {tip && platform && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex cursor-pointer items-center text-muted-foreground/70 hover:text-muted-foreground" />
              }
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64 leading-5">
              {getCreatorMetricTip(tip, normalizeCreatorPlatform(platform))}
            </TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="font-medium text-sm">{children}</span>
    </div>
  );
}

export function CreatorProfileDrawer({
  channel,
  open,
  onOpenChange,
  renderPlatformIcon,
  renderExtra,
}: CreatorProfileDrawerProps) {
  if (!channel) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[min(860px,92vw)]! max-w-none! overflow-y-auto"
        />
      </Sheet>
    );
  }

  const name = channel.channelName || channel.channelURL || "-";
  const videos = channel.videos ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(860px,92vw)]! max-w-none! overflow-y-auto"
      >
        <SheetHeader>
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate" title={name}>
                  {name}
                </SheetTitle>
                {channel.channelType &&
                  renderPlatformIcon?.(channel.channelType)}
                {channel.countryCode && (
                  <CountryFlag
                    value={channel.countryCode}
                    valueFormatted={channel.countryName ?? undefined}
                  />
                )}
              </div>
              <SheetDescription>
                {channel.handle || "未命名达人"}
              </SheetDescription>
              {channel.updatedAgo && (
                <p className="text-muted-foreground text-xs">
                  数据更新于 {channel.updatedAgo}
                </p>
              )}
            </div>
            <a
              href={getAbsoluteUrl(channel.channelURL) || "#"}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" })
              )}
            >
              <ExternalLink className="size-4" />
              渠道主页
            </a>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <InfoField label="粉丝数">{formatMetric(channel.fans)}</InfoField>
            <InfoField label="总播放量">
              {formatMetric(channel.totalViews)}
            </InfoField>
            <InfoField
              label="均观看"
              tip="avgViews"
              platform={channel.channelType}
            >
              {formatMetric(channel.avgViews)}
            </InfoField>
            <InfoField label="视频数">
              {formatMetric(videos.length || null)}
            </InfoField>
            <InfoField
              label="互动率"
              tip="engagementRate"
              platform={channel.channelType}
            >
              {channel.engagementRate != null
                ? `${(channel.engagementRate * 100).toFixed(2)}%`
                : "-"}
            </InfoField>
          </div>

          <section className="flex flex-col gap-2">
            <h4 className="font-medium text-sm">最近视频</h4>
            {videos.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {videos.slice(0, 4).map((video) => (
                  <a
                    key={video.id}
                    href={getAbsoluteUrl(video.url) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 transition-colors hover:bg-accent"
                  >
                    <VideoCover
                      src={video.coverUrl ?? undefined}
                      alt={video.title || "视频封面"}
                      className="aspect-video w-24 shrink-0 rounded-md"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span
                        className="line-clamp-2 font-medium text-slate-700 text-sm group-hover:text-primary group-hover:underline"
                        title={video.title || undefined}
                      >
                        {video.title || "未命名视频"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatMetric(video.totalView)} 播放 ·{" "}
                        {formatVideoDate(video.publishedAt)}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                暂无视频数据
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h4 className="font-medium text-sm">内容与合作</h4>
            <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <TagField
                  label="主行业"
                  values={channel.primaryCategories ?? []}
                />
                <TagField
                  label="商业垂类"
                  values={channel.verticalCategories ?? []}
                />
                <TagField
                  label="内容方向"
                  values={channel.contentTypes ?? []}
                />
                <TagField
                  label="合作方式"
                  values={channel.cooperationModes ?? []}
                />
              </div>
            </div>
          </section>

          {renderExtra?.(channel)}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TagField({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <TagList values={values} />
    </div>
  );
}
