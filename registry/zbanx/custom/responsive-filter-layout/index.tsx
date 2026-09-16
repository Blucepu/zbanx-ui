"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/zbanx/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/registry/zbanx/ui/sheet";
import { Spinner } from "@/registry/zbanx/ui/spinner";
import { Switch } from "@/registry/zbanx/ui/switch";

const FILTER_MIN_COLUMN_WIDTH = 280;
const FILTER_COLUMN_GAP = 24;

export interface ResponsiveFilterItem {
  key: string;
  content: ReactNode;
  selected?: boolean;
}

interface ResponsiveFilterLayoutProps {
  items: ResponsiveFilterItem[];
  searching?: boolean;
  onSearch: () => void;
  onReset: () => void;
  /** 筛选容器的自定义样式 */
  containerClassName?: string;
}

/**
 * 根据容器宽度展示可见筛选项，其余筛选项通过右侧抽屉访问。
 */
export default function ResponsiveFilterLayout({
  items,
  searching = false,
  onSearch,
  onReset,
  containerClassName,
}: ResponsiveFilterLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateVisibleCount = () => {
      const width = container.getBoundingClientRect().width;
      if (!width) {
        return;
      }

      const count = Math.max(
        1,
        Math.floor(
          (width + FILTER_COLUMN_GAP) /
            (FILTER_MIN_COLUMN_WIDTH + FILTER_COLUMN_GAP)
        )
      );
      setVisibleCount(Math.min(items.length, count));
    };

    updateVisibleCount();
    const observer = new ResizeObserver(updateVisibleCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, [items.length]);

  const visibleItems = items.slice(0, visibleCount);
  const hiddenItems = items.slice(visibleCount);
  const selectedHiddenCount = hiddenItems.filter(
    (item) => item.selected
  ).length;

  const handleReset = () => {
    onReset();
    setDrawerOpen(false);
  };

  const handleSearch = () => {
    onSearch();
    setDrawerOpen(false);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cn("mb-6 shrink-0", containerClassName)}
      >
        <div
          className="grid gap-x-6 gap-y-4"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, visibleItems.length)}, minmax(0, 1fr))`,
          }}
        >
          {visibleItems.map((item) => (
            <div key={item.key} className="min-w-0">
              {item.content}
            </div>
          ))}
          <div className="col-span-full flex flex-wrap items-center justify-end gap-3.5">
            {hiddenItems.length > 0 ? (
              <div
                className="flex shrink-0 cursor-pointer items-center gap-2"
                role="button"
                tabIndex={0}
                onClick={() => setDrawerOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setDrawerOpen((open) => !open);
                  }
                }}
              >
                <Switch
                  checked={drawerOpen}
                  onCheckedChange={setDrawerOpen}
                  aria-label="打开更多筛选"
                />
                <span className="font-medium">更多筛选</span>
                {selectedHiddenCount > 0 ? (
                  <span className="min-w-4 rounded-full bg-red-400 px-1 text-center text-white text-xs leading-4">
                    {selectedHiddenCount}
                  </span>
                ) : null}
              </div>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="min-w-14 bg-white text-slate-800 hover:bg-slate-50"
              onClick={handleReset}
              disabled={searching}
            >
              重置
            </Button>
            <Button
              size="sm"
              className="relative min-w-14"
              onClick={onSearch}
              disabled={searching}
            >
              <span className={searching ? "invisible" : undefined}>查询</span>
              {searching ? <Spinner className="absolute size-3.5" /> : null}
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-[400px]"
        >
          <SheetHeader>
            <SheetTitle>筛选条件</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 gap-4 px-4 pb-4 [&_.filter-field]:w-full [&_.filter-field]:flex-col [&_.filter-field-label]:pt-0 [&_.filter-field-label]:font-medium [&_.filter-field-label]:text-slate-950">
            {items.map((item) => (
              <div key={item.key}>{item.content}</div>
            ))}
          </div>
          <SheetFooter className="flex-row justify-end">
            <Button
              variant="outline"
              size="sm"
              className="min-w-14 bg-white text-slate-800 hover:bg-slate-50"
              onClick={handleReset}
              disabled={searching}
            >
              重置
            </Button>
            <Button
              size="sm"
              className="relative min-w-14"
              onClick={handleSearch}
              disabled={searching}
            >
              <span className={searching ? "invisible" : undefined}>查询</span>
              {searching ? <Spinner className="absolute size-3.5" /> : null}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { ResponsiveFilterLayout };
