"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/registry/zbanx/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";

const GAP_PX = 4;

interface TagListProps {
  values: string[];
  emptyText?: string;
}

export function TagList({ values, emptyText = "-" }: TagListProps) {
  const labels = useMemo(() => values.filter(Boolean), [values]);
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure || labels.length === 0) return;

    const recalculate = () => {
      const containerWidth = container.offsetWidth;
      const children = Array.from(measure.children) as HTMLElement[];
      const overflowWidth = children[labels.length]?.offsetWidth ?? 0;

      let used = 0;
      let count = 0;
      for (let i = 0; i < labels.length; i++) {
        const el = children[i];
        if (!el) break;
        const w = el.offsetWidth + (i > 0 ? GAP_PX : 0);
        const remaining = labels.length - i - 1;
        const reserve = remaining > 0 ? GAP_PX + overflowWidth : 0;
        if (used + w + reserve > containerWidth) break;
        used += w;
        count++;
      }
      setVisibleCount(Math.max(count, 1));
    };

    recalculate();
    const ro = new ResizeObserver(recalculate);
    ro.observe(container);
    return () => ro.disconnect();
  }, [labels]);

  useEffect(() => {
    if (!open) return;
    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const insideTrigger = triggerRef.current?.contains(target) ?? false;
      const insideContent = contentRef.current?.contains(target) ?? false;
      if (insideTrigger || insideContent) {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        return;
      }
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        setOpen(false);
        triggerRef.current?.blur();
      }, 30);
    };
    document.addEventListener("pointermove", handlePointerMove);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [open]);

  if (labels.length === 0) {
    return (
      <span className="flex h-full items-center text-muted-foreground">
        {emptyText}
      </span>
    );
  }

  const visible = labels.slice(0, visibleCount);
  const rest = labels.slice(visibleCount);
  const hasOverflow = rest.length > 0;
  const showPopover = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpen(true);
  };

  const summary = (
    <div
      ref={containerRef}
      className="relative flex h-full w-full min-w-0 items-center gap-1 overflow-hidden"
    >
      {visible.map((label) => (
        <Badge
          key={label}
          variant="secondary"
          className="min-w-0 max-w-full shrink font-normal"
          title={label}
        >
          <span className="truncate">{label}</span>
        </Badge>
      ))}
      {hasOverflow && (
        <Badge variant="outline" className="shrink-0">
          +{rest.length}
        </Badge>
      )}
      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute flex items-center gap-1"
        aria-hidden="true"
      >
        {labels.map((label) => (
          <Badge
            key={label}
            variant="secondary"
            className="font-normal whitespace-nowrap"
          >
            {label}
          </Badge>
        ))}
        <Badge variant="outline" className="whitespace-nowrap">
          +{labels.length}
        </Badge>
      </div>
    </div>
  );

  if (!hasOverflow) return summary;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className="flex h-full min-w-0 max-w-full items-center"
        onPointerEnter={showPopover}
      >
        <PopoverTrigger
          render={
            <button
              ref={triggerRef}
              type="button"
              className="block h-full w-full min-w-0 cursor-pointer text-left outline-none focus-visible:ring-0"
              aria-label={`查看全部 ${labels.length} 个标签`}
            />
          }
        >
          {summary}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={0}
          className="w-80 max-w-[calc(100vw-2rem)] p-3"
        >
          <div ref={contentRef}>
            <p className="mb-2 font-medium text-sm">全部标签</p>
            <div className="max-h-[min(60vh,24rem)] overflow-y-auto overscroll-contain rounded-md bg-muted/50 p-2">
              <div className="flex flex-wrap gap-1">
                {labels.map((label, index) => (
                  <Badge
                    key={`${label}-${index}`}
                    variant="secondary"
                    className="min-w-0 max-w-full font-normal"
                    title={label}
                  >
                    <span className="truncate">{label}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}

export default TagList;
