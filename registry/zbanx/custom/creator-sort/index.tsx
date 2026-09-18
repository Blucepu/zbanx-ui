"use client";

import {
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  CreatorSortField,
  CreatorSortValue,
  SortDirection,
} from "@/registry/zbanx/custom/creator-filter-core/types";
import { Button } from "@/registry/zbanx/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";
import { CREATOR_SORT_OPTIONS } from "./config";

export type { CreatorSortField, CreatorSortValue, SortDirection };
export { CREATOR_SORT_OPTIONS };

export interface CreatorSortProps {
  /** null 表示无排序（走后端默认序） */
  value?: CreatorSortValue | null;
  /** 再次点击已选中的升/降序时传 null（取消排序） */
  onChange?: (next: CreatorSortValue | null) => void;
  className?: string;
}

const DIRECTION_BUTTON_BASE =
  "flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-ring";
const DIRECTION_BUTTON_ACTIVE =
  "bg-primary/10 text-primary hover:bg-primary/15";
const DIRECTION_BUTTON_IDLE =
  "text-muted-foreground hover:bg-muted hover:text-foreground";

export function CreatorSort({ value, onChange, className }: CreatorSortProps) {
  const [open, setOpen] = useState(false);
  const active = value != null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<CreatorSortField, HTMLDivElement>());

  useEffect(() => {
    if (!open || value == null) return;
    const frame = requestAnimationFrame(() => {
      const container = scrollRef.current;
      const row = rowRefs.current.get(value.field);
      if (!container || !row) return;
      const containerRect = container.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const deltaTop = rowRect.top - containerRect.top;
      const deltaBottom = rowRect.bottom - containerRect.bottom;
      if (deltaTop < 0) container.scrollTop += deltaTop;
      else if (deltaBottom > 0) container.scrollTop += deltaBottom;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, value]);

  const handleSelect = (field: CreatorSortField, direction: SortDirection) => {
    if (value?.field === field && value?.direction === direction)
      onChange?.(null);
    else onChange?.({ field, direction });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            aria-label="排序"
            aria-expanded={open}
            className={cn(
              active &&
                "border-primary/60 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary",
              className
            )}
          />
        }
      >
        <ArrowDownUp
          className={cn("size-4", active && "opacity-100")}
          aria-hidden="true"
        />
        排序
      </PopoverTrigger>
      <PopoverContent align="end" className="w-fit min-w-44 p-2">
        <div
          ref={scrollRef}
          className="custom-scrollbar max-h-80 overflow-auto overscroll-contain"
          role="group"
          aria-label="排序选项"
        >
          <div className="divide-y divide-border">
            {CREATOR_SORT_OPTIONS.map((option) => {
              const ascActive =
                value?.field === option.field && value?.direction === "ASC";
              const descActive =
                value?.field === option.field && value?.direction === "DESC";
              return (
                <div
                  key={option.field}
                  ref={(node) => {
                    if (node) rowRefs.current.set(option.field, node);
                    else rowRefs.current.delete(option.field);
                  }}
                  className="flex items-center justify-between gap-2 px-2 py-1"
                >
                  <span className="min-w-0 truncate text-foreground text-[13px]">
                    {option.label}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      title={`按${option.label}升序`}
                      aria-label={`按${option.label}升序`}
                      aria-pressed={ascActive}
                      onClick={() => handleSelect(option.field, "ASC")}
                      className={cn(
                        DIRECTION_BUTTON_BASE,
                        ascActive
                          ? DIRECTION_BUTTON_ACTIVE
                          : DIRECTION_BUTTON_IDLE
                      )}
                    >
                      <ArrowUpNarrowWide
                        className="size-3.5"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      title={`按${option.label}降序`}
                      aria-label={`按${option.label}降序`}
                      aria-pressed={descActive}
                      onClick={() => handleSelect(option.field, "DESC")}
                      className={cn(
                        DIRECTION_BUTTON_BASE,
                        descActive
                          ? DIRECTION_BUTTON_ACTIVE
                          : DIRECTION_BUTTON_IDLE
                      )}
                    >
                      <ArrowDownWideNarrow
                        className="size-3.5"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

CreatorSort.displayName = "CreatorSort";

export default CreatorSort;
