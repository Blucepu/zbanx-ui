"use client";

/**
 * 红人搜索 Demo：浏览器直连 QA 接口的真实数据，用移植组件 1:1 还原红人搜索列表。
 * 接口：POST https://v2-api-qa.tbanx.cn/resource/query?__query=creatorChannelListV2&__flag=
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CreatorFilterValues,
  CreatorSortValue,
  PersistedCreatorFilterValues,
} from "@/registry/zbanx/custom/creator-filter-core/types";
import {
  buildCreatorListOrder,
  buildCreatorListWhere,
  stripLabelSnapshot,
} from "@/registry/zbanx/custom/creator-filter-core/where";
import type { CreatorChannelLite } from "@/registry/zbanx/custom/creator-list-item/types";
import { CreatorSearchList } from "@/registry/zbanx/custom/creator-search-list";
import { PlatformIcon } from "@/registry/zbanx/custom/platform-icon";
import { adaptChannel, type CreatorChannelRaw } from "./adapt";

const ENDPOINT =
  "https://v2-api-qa.tbanx.cn/resource/query?__query=creatorChannelListV2&__flag=";
const PAGE_SIZE = 20;

const OPTIONS_BY_FIELD = {
  channelType: {
    options: [
      { value: "Youtube", label: "YouTube" },
      { value: "Instagram", label: "Instagram" },
      { value: "Tiktok", label: "TikTok" },
    ],
    isLoading: false,
  },
  contentTypes: {
    options: [
      { value: "vlog", label: "Vlog" },
      { value: "review", label: "测评" },
    ],
    isLoading: false,
  },
  cooperationModes: {
    options: [
      { value: "9", label: "9" },
      { value: "10", label: "10" },
      { value: "13", label: "13" },
    ],
    isLoading: false,
  },
  language: {
    options: [
      { value: "en", label: "英语" },
      { value: "zh", label: "中文" },
      { value: "pt", label: "葡萄牙语" },
      { value: "es", label: "西班牙语" },
    ],
    isLoading: false,
  },
  productLines: {
    options: [{ value: "lipstick", label: "口红" }],
    isLoading: false,
  },
  eCommerceWebsites: {
    options: [{ value: "amazon", label: "Amazon" }],
    isLoading: false,
  },
};

const SOURCES = {
  countryGroups: [
    {
      id: "sa",
      name: "南美洲",
      items: [
        { value: "BR", label: "巴西" },
        { value: "MX", label: "墨西哥" },
      ],
    },
    {
      id: "na",
      name: "北美洲",
      items: [
        { value: "US", label: "美国" },
        { value: "CA", label: "加拿大" },
      ],
    },
  ],
  countryCounts: { BR: 1024, MX: 512, CA: 256, US: 2048 },
  categoryGroups: [
    {
      id: "g1",
      name: "时尚美妆",
      items: [
        { value: "fashion", label: "时尚", count: 120 },
        { value: "beauty", label: "美妆", count: 340 },
      ],
    },
  ],
  projectOptions: [{ value: "p1", label: "618大促项目" }],
  taskOptions: [{ value: "t1", label: "每日增量任务" }],
};

const ICONS = {
  renderPlatformIcon: (p: string) => (
    <PlatformIcon platform={p} size="md" tooltip={false} />
  ),
  renderChannelItemIcon: (v: string) => (
    <PlatformIcon platform={v} size="sm" tooltip={false} />
  ),
  renderChannelOptionPrefix: (o: { value: string }) => (
    <PlatformIcon platform={o.value} size="sm" tooltip={false} />
  ),
};

interface PageResult {
  items: CreatorChannelRaw[];
  total: number;
}

/** 与原项目 getCookieToken 一致：从 document.cookie 读登录态（qa.auth_token / auth_token） */
function getCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  for (const name of ["qa.auth_token", "auth_token"]) {
    const hit = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`));
    if (hit) return hit.slice(name.length + 1) || null;
  }
  return null;
}

const FIELDS = `count items { id channelName channelURL channelType avatar avatarOssURL countryCode quantity flow official available description uniqueID crawlerUpdatedAt creatorID creator { id name inquiries { id cooperationMode cooperationModes inquiryMin inquiryMax createdAt } } summary { videoCount viewCount avgView avgEngagementRate lastPublishedAt } flinkChannel { verticalCategory primaryVerticalCategory contentType isHighFrequency crawlerUpdatedAt baseUpdatedAt cpm } manualCategoryTypes { tag } channelTypeCooperationModes latestVideos ( size: 4 ) { id title url cover ossCoverURL publishedAt totalView } }`;

const VIDEO_FIELDS = `count items { id title url cover ossCoverURL publishedAt totalView }`; /** 临时 GraphQL 字面量序列化（demo 够用即可） */
function toGraphQLValue(value: unknown): string {
  if (value == null) return "null";
  if (Array.isArray(value)) return `[${value.map(toGraphQLValue).join(", ")}]`;
  if (typeof value === "object") {
    const body = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${toGraphQLValue(v)}`)
      .join(", ");
    return `{ ${body} }`;
  }
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

async function fetchCreatorPage(
  page: number,
  values: CreatorFilterValues,
  sort?: CreatorSortValue | null
): Promise<PageResult> {
  const where = buildCreatorListWhere(stripLabelSnapshot(values));
  const args = [`page: ${page}`, `size: ${PAGE_SIZE}`];
  if (Object.keys(where).length > 0)
    args.push(`where: ${toGraphQLValue(where)}`);
  const order = buildCreatorListOrder(sort);
  if (order) args.push(`orderBy: ${toGraphQLValue(order)}`);
  const query = `query { creatorChannelListV2 ( ${args.join(" ")} ) { ${FIELDS} } }`;
  const cookieToken = getCookieToken();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // 与原项目请求拦截器一致：同域 Cookie 中的 token 放到 Authorization 头
      ...(cookieToken ? { Authorization: `Bearer ${cookieToken}` } : {}),
    },
    // 浏览器直连：允许携带 .tbanx.cn 域 Cookie
    credentials: "include",
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `请求失败（${res.status}）`);
  if (data?.errors?.length) {
    throw new Error(
      data.errors.map((e: { message: string }) => e.message).join("; ")
    );
  }
  const payload = data?.data?.creatorChannelListV2;
  return { items: payload?.items ?? [], total: payload?.count ?? 0 };
}

async function fetchCreatorVideos(
  channelId: string,
  page: number,
  size: number
): Promise<{
  items: NonNullable<CreatorChannelLite["videos"]>;
  total: number;
}> {
  const query = `query { creatorVideoListV2 ( page: ${page} size: ${size} where: ${toGraphQLValue({ channel: { channels: [channelId] } })} orderBy: ${toGraphQLValue({ field: "published_at", direction: "DESC" })} ) { ${VIDEO_FIELDS} } }`;
  const cookieToken = getCookieToken();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(cookieToken ? { Authorization: `Bearer ${cookieToken}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `请求失败（${res.status}）`);
  if (data?.errors?.length) {
    throw new Error(
      data.errors.map((e: { message: string }) => e.message).join("; ")
    );
  }
  const payload = data?.data?.creatorVideoListV2;
  const items = (payload?.items ?? []).map(
    (
      v: CreatorChannelRaw["latestVideos"] extends
        | (infer T)[]
        | null
        | undefined
        ? NonNullable<T>
        : never
    ) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      coverUrl: v.ossCoverURL ?? v.cover,
      publishedAt: v.publishedAt,
      totalView: v.totalView,
    })
  );
  return { items, total: payload?.count ?? 0 };
}

function getDetailHref(channel: CreatorChannelLite): string | null {
  const creatorId = channel.creatorId;
  if (creatorId == null || creatorId === "") return null;
  return `https://v2-qa-banker.tbanx.cn/workspace/creators/${creatorId}?channelId=${channel.id}&source=creator-library&tab=overview`;
}

export default function CreatorSearchDemoPage() {
  const [values, setValues] = useState<PersistedCreatorFilterValues>({});
  const [items, setItems] = useState<
    (CreatorChannelLite & { updatedAgo?: string })[]
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<
    (CreatorChannelLite & { updatedAgo?: string }) | null
  >(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasAuth, setHasAuth] = useState<boolean | null>(null);
  const initialRef = useRef(false);

  const loadPage = useCallback(
    async (
      nextPage: number,
      nextValues: CreatorFilterValues,
      nextSort: CreatorSortValue | null,
      append: boolean
    ) => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }
      try {
        const { items: raws, total: t } = await fetchCreatorPage(
          nextPage,
          nextValues,
          nextSort
        );
        const mapped = raws.map(adaptChannel);
        setItems((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotal(t);
        setPage(nextPage);
        if (!append) setSelectedIds([]);
      } catch (e) {
        if (!append) {
          setItems([]);
          setTotal(0);
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialRef.current) return;
    initialRef.current = true;
    setHasAuth(getCookieToken() != null);
    void loadPage(1, {}, null, false);
  }, [loadPage]);

  const handleApplyFilters = useCallback(
    (next: PersistedCreatorFilterValues) => {
      setValues(next);
      void loadPage(1, next, next.sort ?? null, false);
    },
    [loadPage]
  );

  const handleSortChange = useCallback(
    (next: CreatorSortValue | null) => {
      setValues((prev) => {
        const merged: PersistedCreatorFilterValues = { ...prev };
        if (next) merged.sort = next;
        else delete merged.sort;
        void loadPage(1, merged, next, false);
        return merged;
      });
    },
    [loadPage]
  );

  const handleLoadMore = useCallback(() => {
    void loadPage(page + 1, values, values.sort ?? null, true);
  }, [loadPage, page, values]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-svh w-full flex-col px-4 py-6">
        {hasAuth === false && (
          <p className="mb-3 text-orange-500 text-xs">
            未读取到同域登录 Cookie（qa.auth_token / auth_token），接口将返回
            unauthorized。请先在 .tbanx.cn 域名下登录 web-pm-im 后刷新本页。
          </p>
        )}
        <div className="h-[calc(100svh-3rem)] min-h-[600px] w-full">
          <CreatorSearchList
            values={values}
            onFiltersChange={setValues}
            onClearFilters={() => {
              setValues({});
              setSelectedIds([]);
              void loadPage(1, {}, null, false);
            }}
            onApplyFilters={handleApplyFilters}
            sort={values.sort ?? null}
            onSortChange={handleSortChange}
            getModeLabel={(mode) => mode || "-"}
            fetchVideos={fetchCreatorVideos}
            getDetailHref={getDetailHref}
            drawerWidth={720}
            optionsByField={OPTIONS_BY_FIELD}
            sources={SOURCES}
            {...ICONS}
            items={items}
            total={total}
            loadedPages={page}
            hasMore={items.length < total}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            onLoadMore={handleLoadMore}
            onRetry={() => loadPage(1, values, values.sort ?? null, false)}
            previewChannel={preview}
            previewOpen={previewOpen}
            onPreviewChange={(open, c) => {
              setPreviewOpen(open);
              setPreview(
                (c as CreatorChannelLite & { updatedAgo?: string }) ?? null
              );
            }}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={(id, next) =>
              setSelectedIds((prev) =>
                next ? [...prev, id] : prev.filter((x) => x !== id)
              )
            }
            onClearSelection={() => setSelectedIds([])}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
