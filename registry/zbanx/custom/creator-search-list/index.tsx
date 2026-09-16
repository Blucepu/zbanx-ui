"use client";

import { CloudOff, Filter, Grid2X2, LayoutList } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { LuLoader } from "react-icons/lu";
import { cn } from "@/lib/utils";
import FilterChipsBar from "@/registry/zbanx/custom/creator-filter-bar";
import { CREATOR_FILTER_GROUPS } from "@/registry/zbanx/custom/creator-filter-core/groups";
import type {
  CreatorFilterFieldKey,
  CreatorFilterOption,
  CreatorFilterValues,
  PersistedCreatorFilterValues,
} from "@/registry/zbanx/custom/creator-filter-core/types";
import {
  collectPanelLabels,
  countActiveCreatorFilters,
  mergeLabelSnapshot,
  pruneLabelSnapshot,
} from "@/registry/zbanx/custom/creator-filter-core/where";
import CreatorFilterDrawer from "@/registry/zbanx/custom/creator-filter-ui";
import type { FieldOptionSources } from "@/registry/zbanx/custom/creator-filter-ui/creator-filter-field";
import {
  getFieldPopoverClassName,
  useFieldPopover,
} from "@/registry/zbanx/custom/creator-filter-ui/use-field-popover";
import { useFilterValueLabels } from "@/registry/zbanx/custom/creator-filter-ui/use-filter-value-labels";
import {
  CreatorLibraryListSkeleton,
  CreatorListItem,
} from "@/registry/zbanx/custom/creator-list-item";
import type { CreatorChannelLite } from "@/registry/zbanx/custom/creator-list-item/types";
import { CreatorProfileDrawer } from "@/registry/zbanx/custom/creator-profile-drawer";
import { IconButton } from "@/registry/zbanx/custom/icon-button";
import { Button } from "@/registry/zbanx/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/zbanx/ui/card";
import { Checkbox } from "@/registry/zbanx/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/zbanx/ui/empty";
import { formatNumber } from "@/lib/number/formation";

export interface CreatorSearchListProps {
  title?: string;
  values: PersistedCreatorFilterValues;
  onFiltersChange: (values: PersistedCreatorFilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: (values: PersistedCreatorFilterValues) => void;
  onResetFilters?: () => void;
  optionsByField?: Record<
    string,
    { options: CreatorFilterOption[]; isLoading: boolean }
  >;
  sources?: FieldOptionSources;
  /** 筛选抽屉宽度（px），默认 520 */
  drawerWidth?: number;
  renderChannelOptionPrefix?: (option: CreatorFilterOption) => ReactNode;
  renderChannelItemIcon?: (value: string) => ReactNode;
  renderPlatformIcon?: (platform: string) => ReactNode;
  renderFieldPopover?: (
    key: CreatorFilterFieldKey,
    close: () => void
  ) => ReactNode | null;
  fieldPopoverClassName?: (key: CreatorFilterFieldKey) => string | undefined;
  items: CreatorChannelLite[];
  total?: number;
  loadedPages?: number;
  hasMore?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  /** 筛选恢复失败等横幅提示（橙色） */
  filterError?: string | null;
  onLoadMore?: () => void;
  onRetry?: () => void;
  previewChannel?: CreatorChannelLite | null;
  previewOpen?: boolean;
  onPreviewChange?: (
    open: boolean,
    channel?: CreatorChannelLite | null
  ) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string, selected: boolean) => void;
  onClearSelection?: () => void;
  /** 底部栏右侧扩展（默认展示页码信息），与 QueryList footerExtra 同形 */
  footerExtra?:
    | ReactNode
    | ((info: {
        pageCount: number;
        total: number;
        isError: boolean;
        retry?: () => void;
      }) => ReactNode);
  className?: string;
}

export function CreatorSearchList({
  title = "搜索结果",
  values,
  onFiltersChange,
  onClearFilters,
  onApplyFilters,
  onResetFilters,
  optionsByField = {},
  sources,
  drawerWidth,
  renderChannelOptionPrefix,
  renderChannelItemIcon,
  renderPlatformIcon,
  renderFieldPopover,
  fieldPopoverClassName,
  items,
  total,
  loadedPages,
  hasMore = false,
  loading = false,
  loadingMore = false,
  error,
  filterError,
  onLoadMore,
  onRetry,
  previewChannel,
  previewOpen = false,
  onPreviewChange,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  onClearSelection,
  footerExtra,
  className,
}: CreatorSearchListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore?.();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);

  const fieldPlaceholders = useMemo(() => {
    const map: Record<string, string> = {};
    for (const group of CREATOR_FILTER_GROUPS) {
      for (const field of group.fields) {
        if (!(field.key in map) && field.placeholder)
          map[field.key] = field.placeholder;
      }
    }
    return map;
  }, []);

  const multiSelectOptionsMap = useMemo(() => {
    const map: Record<
      string,
      {
        options: CreatorFilterOption[];
        isLoading: boolean;
        placeholder: string;
      }
    > = {};
    for (const [key, entry] of Object.entries(optionsByField)) {
      map[key] = {
        options: entry.options,
        isLoading: entry.isLoading,
        placeholder: fieldPlaceholders[key] ?? "搜索",
      };
    }
    return map;
  }, [optionsByField, fieldPlaceholders]);

  useFilterValueLabels({
    countryOptions: optionsByField.country?.options,
    taskOptions: optionsByField.taskIDs?.options ?? sources?.taskOptions,
    projectOptions:
      optionsByField.projectID?.options ?? sources?.projectOptions,
    categoryOptions: optionsByField.influencerCategory?.options,
  });

  const defaultFieldPopover = useFieldPopover(
    values,
    (patch) => {
      const current = valuesRef.current;
      const next = { ...current, ...patch };
      const labels = mergeLabelSnapshot(
        pruneLabelSnapshot(current.__labels, next),
        collectPanelLabels(next)
      );
      onFiltersChange(labels ? { ...next, __labels: labels } : next);
    },
    { ...sources, multiSelectOptionsMap, renderChannelOptionPrefix }
  );
  const resolvedFieldPopover = renderFieldPopover ?? defaultFieldPopover;
  const resolvedPopoverClassName =
    fieldPopoverClassName ?? getFieldPopoverClassName;
  const activeCount = countActiveCreatorFilters(values);

  const loadedIds = useMemo(() => items.map((c) => c.id), [items]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedInList = useMemo(
    () => loadedIds.filter((id) => selectedSet.has(id)).length,
    [loadedIds, selectedSet]
  );
  const allChecked =
    loadedIds.length > 0 && selectedInList === loadedIds.length;
  const indeterminate = selectedInList > 0 && selectedInList < loadedIds.length;
  const toggleAll = () => {
    if (allChecked) {
      for (const id of loadedIds) onToggleSelect?.(id, false);
    } else {
      for (const id of loadedIds) {
        if (!selectedSet.has(id)) onToggleSelect?.(id, true);
      }
    }
  };

  const handleApplyFilters = (next: CreatorFilterValues) => {
    onClearSelection?.();
    const labels = mergeLabelSnapshot(
      pruneLabelSnapshot(valuesRef.current.__labels, next),
      collectPanelLabels(next)
    );
    onApplyFilters(labels ? { ...next, __labels: labels } : next);
  };

  const handleResetFilters = () => {
    onClearSelection?.();
    (onResetFilters ?? onClearFilters)();
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3 p-4", className)}>
      <CreatorFilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        values={values}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        width={drawerWidth}
        optionsByField={optionsByField}
        sources={sources}
        renderChannelOptionPrefix={renderChannelOptionPrefix}
        renderChannelItemIcon={renderChannelItemIcon}
      />

      <Card className="flex min-h-0 flex-1 flex-col rounded-lg border-[#F0F0F0] py-4 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-1.5">
            {title}（
            {loading ? (
              <LuLoader
                className="size-3.5 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              formatNumber(total ?? 0)
            )}
            ）
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDrawerOpen(true)}
              className={cn(
                activeCount > 0 &&
                  "border-primary/60 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
              )}
            >
              <Filter
                className={cn("size-4", activeCount > 0 && "opacity-100")}
              />
              筛选
              {activeCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-px font-medium text-[11px] text-primary-foreground leading-4">
                  {activeCount}
                </span>
              )}
            </Button>
            <div className="flex">
              <IconButton
                size="sm"
                tooltip="列表视图"
                aria-label="列表视图"
                aria-pressed="true"
              >
                <LayoutList />
              </IconButton>
              <IconButton
                size="sm"
                tooltip="表格视图（暂未开放）"
                aria-label="表格视图（暂未开放）"
                disabled
              >
                <Grid2X2 />
              </IconButton>
            </div>
          </div>
        </CardHeader>

        {filterError && (
          <p className="px-4 pb-2 text-orange-500 text-xs">{filterError}</p>
        )}

        <div className="px-4 pb-4">
          <FilterChipsBar
            values={values}
            onChange={onFiltersChange}
            onClearAll={onClearFilters}
            onEditRequest={() => setDrawerOpen(true)}
            renderFieldPopover={resolvedFieldPopover}
            fieldPopoverClassName={resolvedPopoverClassName}
            renderChannelIcon={renderPlatformIcon ?? renderChannelItemIcon}
            loading={loading && items.length === 0}
          />
        </div>

        <CardContent className="flex min-h-0 flex-1 flex-col px-0">
          <div className="relative min-h-0 flex-1 @container">
            {loading && items.length === 0 ? (
              <CreatorLibraryListSkeleton />
            ) : error && items.length === 0 ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CloudOff className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>加载失败</EmptyTitle>
                  <EmptyDescription>
                    {error || "网络异常或服务繁忙，请稍后重试。"}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    重试
                  </Button>
                </EmptyContent>
              </Empty>
            ) : items.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>暂无匹配达人</EmptyTitle>
                  <EmptyDescription>请调整筛选条件后重试。</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="h-full overflow-y-auto overscroll-contain">
                {items.map((channel) => (
                  <CreatorListItem
                    key={channel.id}
                    channel={channel}
                    onView={(c) => onPreviewChange?.(true, c)}
                    selectable={selectable}
                    selected={selectedIds.includes(channel.id)}
                    onToggle={(next) => onToggleSelect?.(channel.id, next)}
                    renderPlatformIcon={
                      renderPlatformIcon ?? renderChannelItemIcon
                    }
                  />
                ))}
                <div
                  ref={sentinelRef}
                  className="flex items-center justify-center gap-2 py-2 text-muted-foreground text-xs"
                >
                  {loadingMore && (
                    <>
                      <LuLoader className="size-4 animate-spin" />
                      加载中...
                    </>
                  )}
                </div>
                {!hasMore && !loadingMore && (
                  <p className="py-4 text-center text-muted-foreground text-sm">
                    已加载全部结果
                  </p>
                )}
              </div>
            )}
          </div>
          {(selectable || footerExtra) && items.length > 0 && (
            <div className="flex shrink-0 items-center gap-4 border-t border-[#F0F0F0] px-2 pt-2.5 text-sm">
              {selectable && (
                <>
                  <label
                    htmlFor="creator-search-select-all"
                    className="inline-flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      id="creator-search-select-all"
                      checked={allChecked}
                      indeterminate={indeterminate}
                      onCheckedChange={toggleAll}
                      aria-label="全选当前已加载结果"
                      className="shadow-none"
                    />
                    全选
                  </label>
                  <span className="text-muted-foreground">
                    已选{" "}
                    <span className="font-medium text-primary">
                      {selectedIds.length}
                    </span>{" "}
                    项
                  </span>
                </>
              )}
              <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                {footerExtra !== undefined ? (
                  typeof footerExtra === "function" ? (
                    footerExtra({
                      pageCount: loadedPages ?? 1,
                      total: total ?? items.length,
                      isError: error != null,
                      retry: onRetry,
                    })
                  ) : (
                    footerExtra
                  )
                ) : (
                  <>
                    <span className="text-muted-foreground">
                      已加载第 {loadedPages ?? 1} 页 · 共{" "}
                      {formatNumber(total ?? items.length)} 条
                    </span>
                    {error && (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        重试
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <CreatorProfileDrawer
        channel={previewChannel ?? null}
        open={previewOpen}
        onOpenChange={(open) =>
          onPreviewChange?.(open, open ? previewChannel : null)
        }
        renderPlatformIcon={renderPlatformIcon ?? renderChannelItemIcon}
      />
    </div>
  );
}

export default CreatorSearchList;
