"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleHelp,
  ExternalLink,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { getAbsoluteUrl } from "@/lib/link/index";
import { cn } from "@/lib/utils";
import CountryFlag from "@/registry/zbanx/custom/country-flag";
import {
  formatMetric,
  formatQuoteAmount,
  formatQuoteDate,
  formatRelativeTime,
  formatVideoDate,
} from "@/registry/zbanx/custom/creator-list-item/format";
import {
  getCreatorMetricPeriodLabel,
  getInactiveMetricsTip,
  getStaleDataWarning,
} from "@/registry/zbanx/custom/creator-list-item/metric-freshness";
import {
  type CreatorMetricTip,
  getCreatorMetricTip,
  normalizeCreatorPlatform,
} from "@/registry/zbanx/custom/creator-list-item/metric-tips";
import type {
  CreatorChannelLite,
  CreatorPriceInquiry,
  CreatorVideoLite,
} from "@/registry/zbanx/custom/creator-list-item/types";
import { QuoteSourceBadge } from "@/registry/zbanx/custom/quote-source-badge";
import { VideoCover } from "@/registry/zbanx/custom/video-cover";
import { Button, buttonVariants } from "@/registry/zbanx/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/zbanx/ui/card";
import { ScrollArea } from "@/registry/zbanx/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/registry/zbanx/ui/sheet";
import { Skeleton } from "@/registry/zbanx/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/zbanx/ui/tooltip";

export interface CreatorVideoPage {
  items: CreatorVideoLite[];
  total: number;
}

interface CreatorProfileDrawerProps {
  channel: CreatorChannelLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderPlatformIcon?: (platform: string) => ReactNode;
  /** 合作方式 code 转展示名（默认回退原值） */
  getModeLabel?: (mode?: string) => string;
  /** 按渠道分页拉取视频（默认仅展示 channel.videos） */
  fetchVideos?: (
    channelId: string,
    page: number,
    size: number
  ) => Promise<CreatorVideoPage>;
  /** 查看详情外链（默认不展示按钮） */
  getDetailHref?: (channel: CreatorChannelLite) => string | null;
}

const VIDEO_PAGE_SIZE = 20;

const VIDEO_LOAD_MORE_THRESHOLD = 240;

function InfoField({
  label,
  children,
  tip,
  warning,
  platform,
}: {
  label: string;
  children: React.ReactNode;
  tip?: CreatorMetricTip;
  warning?: string | null;
  platform?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
        {label}
        {warning ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex cursor-help items-center text-amber-600" />
              }
            >
              <AlertTriangle className="size-3.5" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64 leading-5">
              {warning}
            </TooltipContent>
          </Tooltip>
        ) : (
          tip &&
          platform && (
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
          )
        )}
      </span>
      <span className="font-medium text-sm">{children}</span>
    </div>
  );
}

function VideoRows({ videos }: { videos: CreatorVideoLite[] }) {
  return (
    <div className="pr-3">
      {videos.map((video) => (
        <a
          key={video.id}
          href={getAbsoluteUrl(video.url) || "#"}
          target="_blank"
          rel="noreferrer"
          className="group flex w-full min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 transition-colors hover:bg-accent"
        >
          <VideoCover
            src={video.coverUrl ?? undefined}
            alt={video.title || "视频封面"}
            className="aspect-video w-24 shrink-0 rounded-md"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span
              // line-clamp 底层为 -webkit-box，overflow-wrap 在其中不生效，必须用 break-all 才能断开无空格长词
              className="line-clamp-2 min-w-0 break-all font-medium text-slate-700 text-sm group-hover:text-primary group-hover:underline"
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
  );
}

/**
 * 远端分页视频列表（内部调用 useInfiniteQuery，挂载即要求上层存在 QueryClientProvider）。
 * 仅在传入 fetchVideos 时渲染，无 fetchVideos 时不触碰任何 query hook。
 */
function VideoListFetcher({
  channelId,
  fetchVideos,
  onVideosChange,
}: {
  channelId: string;
  fetchVideos: (
    channelId: string,
    page: number,
    size: number
  ) => Promise<CreatorVideoPage>;
  onVideosChange: (
    videos: CreatorVideoLite[],
    total: number | undefined
  ) => void;
}) {
  const videosQuery = useInfiniteQuery({
    queryKey: ["creator-videos", String(channelId)],
    queryFn: ({ pageParam }) =>
      fetchVideos(String(channelId), pageParam, VIDEO_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (total, page) => total + page.items.length,
        0
      );
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    enabled: channelId != null,
    staleTime: 60_000,
  });
  const videoPages = videosQuery.data?.pages ?? [];
  const videos: CreatorVideoLite[] = [];
  const seenVideoIds = new Set<string>();
  for (const page of videoPages) {
    for (const video of page.items) {
      const videoKey = String(video.id);
      // 后端偶发返回重复 id，不去重会导致 key 撞车、列表错乱跳动
      if (seenVideoIds.has(videoKey)) continue;
      seenVideoIds.add(videoKey);
      videos.push(video);
    }
  }
  const duplicateVideoCount =
    videoPages.reduce((count, page) => count + page.items.length, 0) -
    videos.length;
  const total = videosQuery.data?.pages[0]?.total;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = videosQuery;
  const videoKey = videos.map((v) => v.id).join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: 仅以视频 id 指纹与总数为变化信号，避免数组引用变化导致重复上报
  useEffect(() => {
    onVideosChange(videos, total);
  }, [videoKey, total]);
  useEffect(() => {
    if (duplicateVideoCount > 0) {
      console.warn(
        `[creator-videos] 渠道 ${String(channelId)} 返回了 ${duplicateVideoCount} 条重复视频，已去重展示`
      );
    }
  }, [duplicateVideoCount, channelId]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleScroll = () => {
      const nearBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
        VIDEO_LOAD_MORE_THRESHOLD;
      if (nearBottom && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    };
    handleScroll();
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (videosQuery.isPending) return <VideoListSkeleton />;
  if (videosQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <p className="text-center text-muted-foreground text-sm">
          视频加载失败，请稍后重试
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void videosQuery.refetch()}
        >
          重试
        </Button>
      </div>
    );
  }
  if (videos.length === 0) {
    return (
      <p className="py-6 text-center text-muted-foreground text-sm">
        暂无视频数据
      </p>
    );
  }
  return (
    <ScrollArea
      viewportRef={viewportRef}
      className="min-h-0 flex-1"
      viewportClassName="max-h-[420px] overscroll-contain lg:max-h-none"
    >
      <VideoRows videos={videos} />
      {(isFetchingNextPage || !hasNextPage) && (
        <div className="flex min-h-9 items-center justify-center px-2 py-1 text-center text-muted-foreground text-xs">
          {isFetchingNextPage ? "加载更多视频…" : "— 已加载全部 —"}
        </div>
      )}
    </ScrollArea>
  );
}

function VideoListCard({
  channelId,
  videos: initialVideos,
  fetchVideos,
}: {
  channelId: string;
  videos: CreatorVideoLite[];
  fetchVideos?: (
    channelId: string,
    page: number,
    size: number
  ) => Promise<CreatorVideoPage>;
}) {
  const [remoteVideos, setRemoteVideos] = useState<CreatorVideoLite[] | null>(
    null
  );
  const [remoteTotal, setRemoteTotal] = useState<number | undefined>(undefined);
  const videos = remoteVideos ?? initialVideos;
  const total = fetchVideos ? remoteTotal : initialVideos.length;

  return (
    <Card className="flex min-h-0 min-w-0 flex-col gap-0 rounded-xl border-slate-200 py-0 shadow-none">
      <CardHeader className="flex min-h-11 flex-row items-center justify-between gap-2 px-4 py-3">
        <CardTitle className="text-sm">视频列表</CardTitle>
        <span className="text-muted-foreground text-xs">
          已收集视频数 {total ?? "—"}
        </span>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        {fetchVideos ? (
          <VideoListFetcher
            key={`videos-${channelId}`}
            channelId={channelId}
            fetchVideos={fetchVideos}
            onVideosChange={(next, nextTotal) => {
              setRemoteVideos(next);
              setRemoteTotal(nextTotal);
            }}
          />
        ) : videos.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            暂无视频数据
          </p>
        ) : (
          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName="max-h-[420px] overscroll-contain lg:max-h-none"
          >
            <VideoRows videos={videos} />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function VideoListSkeleton() {
  return (
    <div className="pr-3" role="status" aria-label="视频加载中">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex w-full min-w-0 items-center gap-3 border-b border-slate-100 p-2 last:border-b-0"
        >
          <Skeleton className="aspect-video w-28 shrink-0 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="size-4 shrink-0 rounded-full" />
        </div>
      ))}
      <span className="sr-only">视频加载中…</span>
    </div>
  );
}

function QuoteListCard({
  inquiries,
  getModeLabel,
}: {
  inquiries: CreatorPriceInquiry[];
  getModeLabel: (mode?: string) => string;
}) {
  const sorted = [...inquiries].sort(
    (a, b) => inquiryTime(b.createdAt) - inquiryTime(a.createdAt)
  );
  return (
    <Card className="flex min-h-0 min-w-0 flex-col gap-0 rounded-xl border-slate-200 py-0 shadow-none">
      <CardHeader className="flex min-h-11 flex-row items-center justify-between gap-2 px-4 py-3">
        <CardTitle className="text-sm">报价列表</CardTitle>
        <span className="text-muted-foreground text-xs">
          共 {sorted.length} 条
        </span>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            暂无报价数据
          </p>
        ) : (
          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName="max-h-[420px] overscroll-contain lg:max-h-none"
          >
            <div className="grid gap-2 px-2">
              {sorted.map((inquiry, index) => {
                const mode =
                  inquiry.cooperationMode ?? inquiry.cooperationModes?.[0];
                return (
                  <div
                    key={`${inquiry.id}-${index}`}
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <span
                      className="col-start-1 row-start-1 min-w-0 truncate font-medium text-sm"
                      title={getModeLabel(mode)}
                    >
                      {getModeLabel(mode)}
                    </span>
                    <span className="col-start-2 row-start-1 flex items-center justify-end whitespace-nowrap text-muted-foreground text-sm tabular-nums">
                      {formatQuoteAmount(
                        inquiry.inquiryMin,
                        inquiry.inquiryMax
                      )}
                    </span>
                    <span className="col-start-1 row-start-2 flex min-h-5 flex-wrap items-center gap-1">
                      <QuoteSourceBadge />
                    </span>
                    {inquiry.createdAt && (
                      <span className="col-start-2 row-start-2 whitespace-nowrap text-muted-foreground text-xs">
                        报价于 {formatQuoteDate(inquiry.createdAt)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function inquiryTime(value?: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const time = Date.parse(value);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

export function CreatorProfileDrawer({
  channel,
  open,
  onOpenChange,
  renderPlatformIcon,
  getModeLabel = (mode) => mode || "-",
  fetchVideos,
  getDetailHref,
}: CreatorProfileDrawerProps) {
  if (!channel) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex h-full w-[min(860px,92vw)]! max-w-none! flex-col overflow-hidden"
        />
      </Sheet>
    );
  }

  const name = channel.channelName || channel.channelURL || "-";
  const rawHandle = channel.handle || "";
  const displayHandle = rawHandle
    ? rawHandle.startsWith("@")
      ? rawHandle
      : `@${rawHandle}`
    : null;
  const detailHref = getDetailHref?.(channel) ?? null;
  const inquiries = channel.inquiries ?? [];
  const metricPeriod = getCreatorMetricPeriodLabel(channel.channelType);
  const flinkUpdatedAt =
    channel.flinkCrawlerUpdatedAt ??
    channel.flinkBaseUpdatedAt ??
    channel.crawlerUpdatedAt;
  const staleDataWarning = getStaleDataWarning(
    channel.channelType ?? "",
    channel.flinkCrawlerUpdatedAt,
    channel.flinkBaseUpdatedAt
  );
  const inactiveMetricsTip = getInactiveMetricsTip(
    channel.channelType ?? "",
    {
      avgView: channel.avgViews,
      videoCount: channel.videoCount,
      avgEngagementRate: channel.engagementRate,
      lastPublishedAt: channel.lastPublishedAt,
    },
    channel.flinkCrawlerUpdatedAt,
    channel.flinkBaseUpdatedAt
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[min(860px,92vw)]! max-w-none! flex-col overflow-hidden"
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
              {displayHandle && (
                <SheetDescription>{displayHandle}</SheetDescription>
              )}
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                <span>更新于 {formatRelativeTime(flinkUpdatedAt)}</span>
                {staleDataWarning && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className="inline-flex cursor-help items-center gap-1 text-amber-600" />
                      }
                    >
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      数据已过时
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-64 leading-5">
                      {staleDataWarning}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {detailHref && (
                <a
                  href={detailHref}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" })
                  )}
                >
                  <ArrowUpRight className="size-4" />
                  查看详情
                </a>
              )}
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
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 sm:px-6">
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-5">
            <InfoField label="粉丝数">{formatMetric(channel.fans)}</InfoField>
            <InfoField label="总播放量">
              {formatMetric(channel.totalViews)}
            </InfoField>
            <InfoField
              label={`均观看（${metricPeriod}）`}
              tip="avgViews"
              warning={inactiveMetricsTip}
              platform={channel.channelType}
            >
              {formatMetric(channel.avgViews)}
            </InfoField>
            <InfoField
              label={`视频数（${metricPeriod}）`}
              warning={inactiveMetricsTip}
            >
              {formatMetric(channel.videoCount)}
            </InfoField>
            <InfoField
              label={`互动率（${metricPeriod}）`}
              tip="engagementRate"
              warning={inactiveMetricsTip}
              platform={channel.channelType}
            >
              {channel.engagementRate != null
                ? `${(channel.engagementRate * 100).toFixed(2)}%`
                : "-"}
            </InfoField>
          </div>

          <div className="grid min-h-[360px] flex-1 gap-4 lg:min-h-[480px] lg:grid-cols-2">
            <VideoListCard
              key={`videos-${channel.id}`}
              channelId={channel.id}
              videos={channel.videos ?? []}
              fetchVideos={fetchVideos}
            />
            <QuoteListCard
              key={`quotes-${channel.id}`}
              inquiries={inquiries}
              getModeLabel={getModeLabel}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
