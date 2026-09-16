"use client";

import {
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/zbanx/ui/select";

type PageItem =
  | { key: string; type: "page"; page: number }
  | { key: string; type: "jump-prev"; page: number }
  | { key: string; type: "jump-next"; page: number };

function buildPageItems(current: number, allPages: number): PageItem[] {
  const buffer = 2;

  if (allPages <= 3 + buffer * 2) {
    return Array.from({ length: allPages }, (_, i) => ({
      key: `p-${i + 1}`,
      type: "page" as const,
      page: i + 1,
    }));
  }

  const jumpPrevPage = Math.max(1, current - 5);
  const jumpNextPage = Math.min(allPages, current + 5);

  let left = Math.max(1, current - buffer);
  let right = Math.min(current + buffer, allPages);
  if (current - 1 <= buffer) right = 1 + buffer * 2;
  if (allPages - current <= buffer) left = allPages - buffer * 2;

  const hasJumpPrev = current - 1 >= buffer * 2 && current !== 1 + buffer;
  const hasJumpNext =
    allPages - current >= buffer * 2 && current !== allPages - buffer;

  if (hasJumpPrev && right !== allPages) left += 1;
  if (hasJumpNext && left !== 1) right -= 1;

  const items: PageItem[] = [];
  if (left !== 1) items.push({ key: "p-1", type: "page", page: 1 });
  if (hasJumpPrev)
    items.push({ key: "jump-prev", type: "jump-prev", page: jumpPrevPage });
  for (let i = left; i <= right; i += 1)
    items.push({ key: `p-${i}`, type: "page", page: i });
  if (hasJumpNext)
    items.push({ key: "jump-next", type: "jump-next", page: jumpNextPage });
  if (right !== allPages)
    items.push({ key: `p-${allPages}`, type: "page", page: allPages });
  return items;
}

const ITEM_BASE_CLASS =
  "flex h-6 min-w-6 cursor-pointer select-none items-center justify-center rounded border bg-white text-xs leading-none transition-colors";

interface PaginationClassicProps {
  current: number;
  pageSize: number;
  total: number;
  onChange?: (page: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onShowSizeChange?: (current: number, size: number) => void;
  pageSizeSelectClassName?: string;
}

export default function PaginationClassic({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  onShowSizeChange,
  pageSizeSelectClassName,
}: PaginationClassicProps) {
  const allPages = Math.floor((total - 1) / pageSize) + 1;
  if (allPages <= 0) return null;

  const items = buildPageItems(current, allPages);

  return (
    <ul className="flex items-center gap-2">
      <li>
        <button
          type="button"
          aria-label="上一页"
          disabled={current <= 1}
          onClick={() => onChange?.(current - 1)}
          className={cn(
            ITEM_BASE_CLASS,
            "border-[#d9d9d9] text-black/88 hover:enabled:border-primary hover:enabled:text-primary disabled:cursor-not-allowed disabled:text-black/25"
          )}
        >
          <LuChevronLeft className="size-3" />
        </button>
      </li>

      {items.map((item) => {
        if (item.type === "page") {
          const active = item.page === current;
          return (
            <li key={item.key}>
              <button
                type="button"
                title={String(item.page)}
                aria-current={active ? "page" : undefined}
                onClick={() => onChange?.(item.page)}
                className={cn(
                  ITEM_BASE_CLASS,
                  active
                    ? "border-primary font-medium text-primary"
                    : "border-[#d9d9d9] text-black/88 hover:border-primary hover:text-primary"
                )}
              >
                {item.page}
              </button>
            </li>
          );
        }

        const isPrev = item.type === "jump-prev";
        return (
          <li key={item.key}>
            <button
              type="button"
              title={isPrev ? "向前 5 页" : "向后 5 页"}
              onClick={() => onChange?.(item.page)}
              className={cn(
                ITEM_BASE_CLASS,
                "group border-transparent text-black/25 hover:text-primary"
              )}
            >
              <span className="tracking-tighter group-hover:hidden">•••</span>
              {isPrev ? (
                <LuChevronsLeft className="hidden size-3 group-hover:block" />
              ) : (
                <LuChevronsRight className="hidden size-3 group-hover:block" />
              )}
            </button>
          </li>
        );
      })}

      <li>
        <button
          type="button"
          aria-label="下一页"
          disabled={current >= allPages}
          onClick={() => onChange?.(current + 1)}
          className={cn(
            ITEM_BASE_CLASS,
            "border-[#d9d9d9] text-black/88 hover:enabled:border-primary hover:enabled:text-primary disabled:cursor-not-allowed disabled:text-black/25"
          )}
        >
          <LuChevronRight className="size-3" />
        </button>
      </li>

      {showSizeChanger && (
        <li>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onShowSizeChange?.(current, Number(val))}
          >
            <SelectTrigger
              size="sm"
              className="h-6 w-auto min-w-0 gap-1 rounded border-[#d9d9d9] px-2 text-black/88 text-xs shadow-none hover:border-primary hover:text-primary [&_svg]:size-3"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={pageSizeSelectClassName}>
              {pageSizeOptions.map((opt) => (
                <SelectItem
                  key={opt}
                  value={String(opt)}
                  className="py-1 text-xs"
                >
                  {opt} 条/页
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </li>
      )}
    </ul>
  );
}

export { PaginationClassic };
