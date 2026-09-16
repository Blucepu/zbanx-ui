"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type ScrollerProps, Virtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/zbanx/ui/button";
import { Checkbox } from "@/registry/zbanx/ui/checkbox";
import { Skeleton } from "@/registry/zbanx/ui/skeleton";
import { QueryListContext } from "./context";
import { useQueryListStore } from "./hooks";
import { createSelectionStore, type SelectionStore } from "./selection-store";
import type { QueryListFooterExtra, QueryListProps } from "./types";

export {
  useQueryListRef,
  useQueryListStore,
  useQueryListUI,
  useRowSelection,
} from "./hooks";
export { createSelectionStore, type SelectionStore } from "./selection-store";
export type {
  QueryListFetchFn,
  QueryListFooterExtra,
  QueryListFooterInfo,
  QueryListProps,
  QueryListRef,
} from "./types";

function DefaultSkeleton() {
  return (
    <div className="space-y-2 border-b border-border px-2 py-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function SkeletonRows({
  count,
  renderSkeleton,
}: {
  count: number;
  renderSkeleton?: () => React.ReactNode;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) =>
        renderSkeleton ? (
          <div key={index}>{renderSkeleton()}</div>
        ) : (
          <DefaultSkeleton key={index} />
        )
      )}
    </>
  );
}

const QueryListScroller = forwardRef<HTMLDivElement, ScrollerProps>(
  function QueryListScroller(props, ref) {
    return (
      <div
        ref={ref}
        style={props.style}
        tabIndex={props.tabIndex}
        data-testid={props["data-testid"]}
        data-virtuoso-scroller={props["data-virtuoso-scroller"]}
        className="custom-scrollbar"
      >
        {props.children}
      </div>
    );
  }
);

function QueryListFooter<TItem>({
  items,
  rowKey,
  selectable,
  footerExtra,
  pageCount,
  total,
  isError,
  retry,
}: {
  items: TItem[];
  rowKey: (row: TItem) => string;
  selectable: boolean;
  footerExtra: QueryListFooterExtra | undefined;
  pageCount: number;
  total: number;
  isError: boolean;
  retry: () => void;
}) {
  const store = useQueryListStore();
  // 禁止在渲染中裸调 store 方法取数——Compiler 会把稳定对象上的纯方法调用结果跨渲染缓存，导致读到冻结值
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    store.getSelectedIds()
  );
  useEffect(
    () => store.subscribe(() => setSelectedIds(store.getSelectedIds())),
    [store]
  );
  const loadedIds = useMemo(() => items.map(rowKey), [items, rowKey]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedInList = useMemo(
    () => loadedIds.filter((id) => selectedSet.has(id)).length,
    [loadedIds, selectedSet]
  );
  const allChecked =
    loadedIds.length > 0 && selectedInList === loadedIds.length;
  const indeterminate = selectedInList > 0 && selectedInList < loadedIds.length;

  const toggleAll = useCallback(() => {
    if (allChecked) store.removeAll(loadedIds);
    else store.selectAll(loadedIds);
  }, [store, allChecked, loadedIds]);

  return (
    <div className="flex shrink-0 items-center gap-4 border-t border-[#F0F0F0] px-2 pt-2.5 text-sm">
      {selectable && (
        <>
          <label
            htmlFor="query-list-select-all"
            className="inline-flex cursor-pointer items-center gap-2"
          >
            <Checkbox
              id="query-list-select-all"
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
      {footerExtra && (
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          {typeof footerExtra === "function"
            ? footerExtra({ pageCount, total, isError, retry })
            : footerExtra}
        </div>
      )}
    </div>
  );
}

export function QueryList<TItem, TFilters = Record<string, unknown>>(
  props: QueryListProps<TItem, TFilters>
) {
  const {
    fetchPage,
    filters,
    queryKey,
    rowKey,
    renderItem,
    renderSkeleton,
    renderEmpty,
    renderError,
    footerExtra,
    listEndText,
    pageSize = 20,
    selectable = false,
    listRef,
    onSelectionChange,
    onTotalChange,
    onError,
    onLoadingChange,
    enabled = true,
    className,
    estimatedItemHeight,
  } = props;

  const queryClient = useQueryClient();
  const [resetToken, setResetToken] = useState(0);
  const [cleared, setCleared] = useState(false);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const storeRef = useRef<SelectionStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createSelectionStore((ids) =>
      onSelectionChangeRef.current?.(ids)
    );
  }
  const store = storeRef.current;

  const key = useMemo(
    () => [...queryKey, pageSize, resetToken],
    [queryKey, pageSize, resetToken]
  );
  const keyRef = useRef(key);
  keyRef.current = key;

  // biome-ignore lint/correctness/useExhaustiveDependencies: 刻意以 filters 引用变化为触发器；store 为 ref 单例稳定引用
  useEffect(() => {
    setCleared(false);
    store.clear();
  }, [filters]);

  const listQuery = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) =>
      fetchPage({
        filters: filtersRef.current,
        page: pageParam,
        size: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const attempted = allPages.length * pageSize;
      return attempted < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: enabled && !cleared,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const queryRef = useRef(listQuery);
  queryRef.current = listQuery;

  const loading = listQuery.isFetching || (listQuery.isPending && !cleared);
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [onLoadingChange, loading]);

  useEffect(() => {
    if (listQuery.error) onError?.(listQuery.error);
  }, [onError, listQuery.error]);

  const refetchCurrent = useCallback(() => {
    void queryRef.current.refetch({ cancelRefetch: false });
  }, []);

  const reload = useCallback(() => {
    setCleared(false);
    refetchCurrent();
  }, [refetchCurrent]);

  const reloadToFirstPage = useCallback(() => {
    setCleared(false);
    setResetToken((token) => token + 1);
  }, []);

  const clear = useCallback(() => {
    setCleared(true);
    store.clear();
    void queryClient.removeQueries({ queryKey: keyRef.current });
  }, [queryClient, store]);

  const rowsRef = useRef(new Map<string, TItem>());

  if (listRef) {
    listRef.reload = (options) => {
      if (options?.toFirstPage) reloadToFirstPage();
      else reload();
    };
    listRef.clear = clear;
    listRef.getSelectedIds = () => store.getSelectedIds();
    listRef.getSelectedRows = () => {
      const rows: TItem[] = [];
      for (const id of store.getSelectedIds()) {
        const row = rowsRef.current.get(id);
        if (row) rows.push(row);
      }
      return rows;
    };
    listRef.clearSelection = () => store.clear();
  }

  const pages = listQuery.data?.pages ?? [];
  const items = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const total = pages[0]?.total ?? 0;
  useEffect(() => {
    onTotalChange?.(total);
  }, [onTotalChange, total]);
  useEffect(() => {
    const map = new Map<string, TItem>();
    for (const item of items) map.set(rowKey(item), item);
    rowsRef.current = map;
  }, [items, rowKey]);

  const retry = refetchCurrent;

  // 防同 tick 双触发（isFetchingNextPage 是异步状态，同 tick 内读到的是 stale 值）
  const inflightRef = useRef(false);
  // 仅认 false→true 跳变，杜绝慢网速下贴底不动连环取数
  const atTopRef = useRef(true);
  const atBottomRef = useRef(false);

  const tryFetchNext = useCallback(() => {
    const query = queryRef.current;
    if (
      inflightRef.current ||
      query.isFetchingNextPage ||
      !query.hasNextPage ||
      query.error
    )
      return;
    inflightRef.current = true;
    void query.fetchNextPage({ cancelRefetch: false }).finally(() => {
      inflightRef.current = false;
    });
  }, []);

  const handleAtTopChange = useCallback((atTop: boolean) => {
    atTopRef.current = atTop;
  }, []);

  const handleAtBottomChange = useCallback(
    (atBottom: boolean) => {
      const wasAtBottom = atBottomRef.current;
      atBottomRef.current = atBottom;
      if (atBottom && !wasAtBottom) tryFetchNext();
    },
    [tryFetchNext]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: 刻意以 items.length 变化为触发器
  useEffect(() => {
    if (atTopRef.current && atBottomRef.current) tryFetchNext();
  }, [items.length, tryFetchNext]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: 刻意以 key 引用变化为触发器
  useEffect(() => {
    atTopRef.current = true;
    atBottomRef.current = false;
  }, [key]);

  const contextValue = useMemo(
    () => ({ store, selectable }),
    [store, selectable]
  );

  const error = listQuery.error instanceof Error ? listQuery.error : null;
  const showSkeleton = listQuery.isPending && items.length === 0 && !cleared;
  const showError = error != null && items.length === 0;

  return (
    <QueryListContext.Provider value={contextValue}>
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="min-h-0 flex-1">
          {showSkeleton ? (
            <SkeletonRows count={4} renderSkeleton={renderSkeleton} />
          ) : showError ? (
            (renderError?.(error, retry) ?? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-10">
                <p className="text-muted-foreground text-sm">
                  加载失败，请稍后重试。
                </p>
                <Button variant="outline" size="sm" onClick={retry}>
                  重试
                </Button>
              </div>
            ))
          ) : items.length === 0 ? (
            (renderEmpty?.() ?? (
              <p className="py-10 text-center text-muted-foreground text-sm">
                暂无数据
              </p>
            ))
          ) : (
            <Virtuoso
              className="h-full rounded-lg"
              data={items}
              defaultItemHeight={estimatedItemHeight}
              atTopStateChange={handleAtTopChange}
              atBottomStateChange={handleAtBottomChange}
              itemContent={(index, row) => renderItem(row, index)}
              components={{
                Scroller: QueryListScroller,
                Footer: () => (
                  <div>
                    {listQuery.isFetchingNextPage && (
                      <SkeletonRows count={2} renderSkeleton={renderSkeleton} />
                    )}
                    {!listQuery.hasNextPage && listEndText}
                  </div>
                ),
              }}
            />
          )}
        </div>
        {(selectable || footerExtra) && items.length > 0 && (
          <QueryListFooter
            items={items}
            rowKey={rowKey}
            selectable={selectable}
            footerExtra={footerExtra}
            pageCount={pages.length}
            total={total}
            isError={listQuery.isError}
            retry={retry}
          />
        )}
      </div>
    </QueryListContext.Provider>
  );
}

export default QueryList;
