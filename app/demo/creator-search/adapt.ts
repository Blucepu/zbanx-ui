/**
 * 接口数据 → 组件数据的适配层。
 * 对照原 `creator-search-service` 取字段 + `creator-library-list-item` 取值逻辑；
 * 合作方式标签缺字典时回退原值（与原 `useCooperationTypeMap.getLabel` 一致）。
 */
import type { CreatorChannelLite } from "@/registry/zbanx/custom/creator-list-item/types";

export interface CreatorVideoRaw {
  id: string;
  title?: string | null;
  url?: string | null;
  cover?: string | null;
  ossCoverURL?: string | null;
  publishedAt?: string | null;
  totalView?: number | null;
}

export interface CreatorChannelRaw {
  id: string;
  channelName?: string | null;
  channelURL?: string | null;
  channelType?: string | null;
  avatar?: string | null;
  avatarOssURL?: string | null;
  countryCode?: string | null;
  quantity?: number | null;
  flow?: number | null;
  official?: boolean | null;
  available?: boolean | null;
  description?: string | null;
  uniqueID?: string | null;
  crawlerUpdatedAt?: string | null;
  creator?: { name?: string | null } | null;
  summary?: {
    videoCount?: number | null;
    viewCount?: number | null;
    avgView?: number | null;
    avgEngagementRate?: number | null;
  } | null;
  flinkChannel?: {
    verticalCategory?: unknown;
    primaryVerticalCategory?: unknown;
    contentType?: unknown;
    isHighFrequency?: boolean | null;
  } | null;
  manualCategoryTypes?: unknown;
  channelTypeCooperationModes?: string[] | null;
  latestVideos?: CreatorVideoRaw[] | null;
}

export interface CreatorChannelListV2Payload {
  count: number;
  items: CreatorChannelRaw[];
}

const COUNTRY_NAMES: Record<string, string> = {
  BR: "巴西",
  MX: "墨西哥",
  CA: "加拿大",
  US: "美国",
  GB: "英国",
  UK: "英国",
  JP: "日本",
  KR: "韩国",
  DE: "德国",
  FR: "法国",
};

function flattenStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const flat = value.flat(Infinity) as unknown[];
  return [
    ...new Set(
      flat.filter((v): v is string => typeof v === "string" && v.length > 0)
    ),
  ];
}

function relativeAgo(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return undefined;
  const diff = Date.now() - t;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}天前`;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function adaptChannel(
  raw: CreatorChannelRaw
): CreatorChannelLite & { updatedAgo?: string } {
  return {
    id: raw.id,
    channelName: raw.channelName,
    channelURL: raw.channelURL,
    channelType: raw.channelType,
    avatarUrl: raw.avatarOssURL ?? raw.avatar,
    countryCode: raw.countryCode || null,
    countryName:
      raw.countryCode && COUNTRY_NAMES[raw.countryCode.toUpperCase()]
        ? COUNTRY_NAMES[raw.countryCode.toUpperCase()]
        : raw.countryCode || undefined,
    handle: raw.creator?.name ?? raw.uniqueID,
    official: raw.official,
    unavailable: raw.available === false,
    highFrequency: raw.flinkChannel?.isHighFrequency ?? false,
    fans: raw.quantity,
    totalViews: raw.flow ?? raw.summary?.viewCount,
    avgViews: raw.summary?.avgView,
    engagementRate: raw.summary?.avgEngagementRate,
    description: raw.description,
    primaryCategories: flattenStrings(
      raw.flinkChannel?.primaryVerticalCategory
    ),
    verticalCategories: flattenStrings(raw.flinkChannel?.verticalCategory),
    contentTypes: flattenStrings(raw.flinkChannel?.contentType),
    cooperationModes: (raw.channelTypeCooperationModes ?? []).filter(Boolean),
    videos: (raw.latestVideos ?? []).slice(0, 4).map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      coverUrl: v.ossCoverURL ?? v.cover,
      publishedAt: v.publishedAt,
      totalView: v.totalView,
    })),
    updatedAgo: relativeAgo(raw.crawlerUpdatedAt),
  };
}
