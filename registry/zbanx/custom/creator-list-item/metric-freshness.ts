import { normalizeCreatorPlatform } from "./metric-tips";

export function getCreatorPlatformThresholdDays(
  platform?: string | null
): number {
  return normalizeCreatorPlatform(platform) === "youtube" ? 90 : 30;
}

export function getCreatorMetricPeriodLabel(platform?: string | null): string {
  return `${getCreatorPlatformThresholdDays(platform)}天`;
}

export interface ChannelFreshnessSummary {
  avgView?: number | null;
  videoCount?: number | null;
  avgEngagementRate?: number | null;
  lastPublishedAt?: string | null;
}

function diffDays(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export function getStaleDataWarning(
  channelType: string,
  crawlerUpdatedAt?: string | null,
  baseUpdatedAt?: string | null
): string | null {
  const threshold = getCreatorPlatformThresholdDays(channelType);
  const updatedAt = crawlerUpdatedAt ?? baseUpdatedAt ?? null;
  const days = diffDays(updatedAt);
  // 与原 dayjs 逻辑一致：日期无效时同样视为过时
  if (days != null && days <= threshold) return null;
  return `数据更新超过${threshold}天`;
}

export function getInactiveMetricsTip(
  channelType: string,
  summary?: ChannelFreshnessSummary | null,
  crawlerUpdatedAt?: string | null,
  baseUpdatedAt?: string | null
): string | null {
  const allMetricsZero =
    (summary?.avgView ?? 0) === 0 &&
    (summary?.videoCount ?? 0) === 0 &&
    (summary?.avgEngagementRate ?? 0) === 0;
  if (!allMetricsZero) return null;
  const threshold = getCreatorPlatformThresholdDays(channelType);
  const lastDays = diffDays(summary?.lastPublishedAt ?? null);
  if (lastDays != null && lastDays <= threshold) return null;
  if (getStaleDataWarning(channelType, crawlerUpdatedAt, baseUpdatedAt)) {
    return `该渠道${threshold}天内未发布视频，也可能由数据超过${threshold}天未更新导致`;
  }
  return `该渠道${threshold}天内未发布视频`;
}
