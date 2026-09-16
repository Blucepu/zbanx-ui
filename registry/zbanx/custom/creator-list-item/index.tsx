"use client";

import { CircleHelp, ExternalLink, VideoOff } from "lucide-react";
import type { ReactNode } from "react";
import { FaPlayCircle } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { ClampedText } from "@/registry/zbanx/custom/clamped-text";
import CountryFlag from "@/registry/zbanx/custom/country-flag";
import { TagList } from "@/registry/zbanx/custom/tag-list";
import { VideoCover } from "@/registry/zbanx/custom/video-cover";
import { Button } from "@/registry/zbanx/ui/button";
import { Checkbox } from "@/registry/zbanx/ui/checkbox";
import { Skeleton } from "@/registry/zbanx/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/zbanx/ui/tooltip";
import { getAbsoluteUrl } from "@/lib/link/index";
import { getOssThumbUrl } from "@/lib/oss-image/index";
import { CreatorAvatar } from "./creator-avatar";
import { formatMetric, formatVideoDate } from "./format";
import {
  type CreatorMetricTip,
  getCreatorMetricTip,
  normalizeCreatorPlatform,
} from "./metric-tips";
import type { CreatorChannelLite } from "./types";

export type { CreatorVideoLite } from "./types";
export type { CreatorChannelLite };

interface CreatorListItemProps {
  channel: CreatorChannelLite;
  onView?: (channel: CreatorChannelLite) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
  /** 平台图标（默认不展示，调用方可注入 platform-icon 映射） */
  renderPlatformIcon?: (platform: string) => ReactNode;
}

const GRID_CLASS =
  "relative grid gap-3 border-b border-[#F0F0F0] px-2 py-4 transition-colors lg:grid-cols-[minmax(22.5rem,1fr)_minmax(260px,320px)_23rem_6rem] lg:items-stretch @min-[1460px]:grid-cols-[minmax(22.5rem,1fr)_minmax(532px,652px)_23rem_6rem] @min-[1820px]:grid-cols-[minmax(22.5rem,1fr)_minmax(532px,652px)_46.25rem_6rem]";

export function CreatorListItem({
  channel,
  onView,
  selectable = false,
  selected = false,
  onToggle,
  renderPlatformIcon,
}: CreatorListItemProps) {
  const name = channel.channelName || channel.channelURL || "-";
  const handle = channel.handle || "";
  const displayHandle = handle
    ? handle.startsWith("@")
      ? handle
      : `@${handle}`
    : "";
  const videos = (channel.videos ?? []).slice(0, 4);
  const statusTags = [
    channel.highFrequency ? "高频" : null,
    channel.unavailable ? "ZBANX不可用" : null,
  ].filter((tag): tag is string => tag !== null);

  return (
    <div
      className={cn(
        GRID_CLASS,
        selectable && "pl-8",
        selected && "bg-primary/5"
      )}
    >
      {selectable && (
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onToggle?.(value === true)}
          aria-label={`选择${name}`}
          className="absolute top-1/2 left-2 -translate-y-1/2 shadow-none"
          onClick={(event) => event.stopPropagation()}
        />
      )}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <CreatorAvatar
            className="size-16 shrink-0"
            src={
              channel.avatarUrl
                ? getOssThumbUrl(channel.avatarUrl, { width: 64 }) || undefined
                : undefined
            }
            name={name}
          />
          <div className="min-w-0">
            <a
              href={getAbsoluteUrl(channel.channelURL) || "#"}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex max-w-full items-center gap-1.5 text-left"
              aria-label="打开渠道主页"
            >
              <span
                className="flex min-w-0 items-center gap-1 truncate font-semibold text-sm hover:text-primary"
                title={name}
              >
                {name}
                <ExternalLink className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </span>
              {channel.channelType && renderPlatformIcon?.(channel.channelType)}
              {channel.official && (
                <span className="shrink-0 text-blue-500 text-xs">官方</span>
              )}
            </a>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
              <CountryFlag
                value={channel.countryCode ?? undefined}
                valueFormatted={channel.countryName ?? undefined}
              />
              <span
                className="min-w-0 truncate"
                title={displayHandle || undefined}
              >
                {displayHandle}
              </span>
            </div>
            {statusTags.length > 0 && (
              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
                {statusTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex shrink-0 items-center rounded-full border border-[#1890ff]/15 bg-[#1890ff]/5 px-2 py-px text-[#1890ff] text-[11px] leading-4"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <ClampedText
          text={channel.description || ""}
          emptyText="-"
          className="rounded-lg bg-muted/40 px-3 py-2 text-muted-foreground text-xs leading-5"
        />
      </div>

      <div className="grid min-w-0 content-start gap-3 @min-[1460px]:grid-cols-2">
        <div className="grid min-w-0 gap-2 rounded-lg bg-muted/40 px-4 py-2 text-xs">
          <Metric label="粉丝" value={formatMetric(channel.fans)} />
          <Metric label="总播放" value={formatMetric(channel.totalViews)} />
          <Metric
            label="均观看"
            value={formatMetric(channel.avgViews)}
            tip="avgViews"
            platform={channel.channelType}
          />
          <Metric
            label="互动率"
            value={
              channel.engagementRate != null
                ? `${(channel.engagementRate * 100).toFixed(2)}%`
                : "-"
            }
            tip="engagementRate"
            platform={channel.channelType}
          />
        </div>
        <div className="grid min-h-[100px] min-w-0 gap-2 rounded-lg bg-muted/40 px-4 py-2 text-xs">
          <TagField label="主行业" values={channel.primaryCategories ?? []} />
          <TagField
            label="商业垂类"
            values={channel.verticalCategories ?? []}
          />
          <TagField label="内容方向" values={channel.contentTypes ?? []} />
          <TagField label="合作方式" values={channel.cooperationModes ?? []} />
        </div>
      </div>

      {videos.length > 0 ? (
        <div className="grid min-w-0 grid-cols-2 gap-1 @min-[1820px]:grid-cols-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="relative aspect-video overflow-hidden rounded-md bg-muted"
            >
              <a
                href={getAbsoluteUrl(video.url) || "#"}
                target="_blank"
                rel="noreferrer"
                aria-label={`打开视频 ${video.title || "视频"}`}
              >
                <VideoCover
                  src={video.coverUrl ?? undefined}
                  alt={video.title || "视频封面"}
                  className="size-full"
                >
                  <span
                    className="absolute inset-x-0 top-0 line-clamp-2 bg-linear-to-b from-black/75 to-transparent px-1.5 pt-1 pb-3 text-[10px] text-white"
                    title={video.title || undefined}
                  >
                    {video.title}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-linear-to-t from-black/80 to-transparent px-1.5 pt-3 pb-1 text-[10px] text-white">
                    <span className="truncate">
                      {formatVideoDate(video.publishedAt)}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5">
                      <FaPlayCircle />
                      {formatMetric(video.totalView)}
                    </span>
                  </span>
                </VideoCover>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-1 @min-[1820px]:grid-cols-4">
          <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-md bg-muted/40 px-2 text-center">
            <VideoOff
              className="size-5 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-xs">暂无视频数据</p>
          </div>
        </div>
      )}

      <div className="flex flex-row items-center justify-center gap-2 lg:flex-col lg:items-center lg:justify-center">
        <Button size="sm" onClick={() => onView?.(channel)}>
          快速查看
        </Button>
      </div>
    </div>
  );
}

export function CreatorListItemSkeleton({
  selectable = false,
}: {
  selectable?: boolean;
}) {
  return (
    <div className={cn(GRID_CLASS, selectable && "pl-8")}>
      {selectable && (
        <Skeleton className="absolute top-1/2 left-2 size-4 -translate-y-1/2 rounded-[4px]" />
      )}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="space-y-2 rounded-lg bg-muted/40 px-3 py-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="grid min-w-0 content-start gap-3 @min-[1460px]:grid-cols-2">
        <div className="grid gap-2 rounded-lg bg-muted/40 px-4 py-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`metric-${index}`}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2"
            >
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="grid gap-2 rounded-lg bg-muted/40 px-4 py-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`tag-${index}`}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2"
            >
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-1 @min-[1820px]:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={`video-${index}`}
            className="aspect-video rounded-md"
          />
        ))}
      </div>
      <div className="flex flex-row items-center justify-center gap-2 lg:flex-col lg:items-center lg:justify-center">
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function CreatorLibraryListSkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, index) => (
        <CreatorListItemSkeleton key={index} />
      ))}
    </div>
  );
}

function TagField({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <TagList values={values} />
    </div>
  );
}

function Metric({
  label,
  value,
  tip,
  platform,
}: {
  label: string;
  value: string;
  tip?: CreatorMetricTip;
  platform?: string | null;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2">
      <span className="inline-flex items-center gap-1 text-muted-foreground">
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
      <span className="max-w-28 truncate font-medium" title={value}>
        {value}
      </span>
    </div>
  );
}
