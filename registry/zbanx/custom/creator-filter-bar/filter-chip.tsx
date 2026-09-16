"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/registry/zbanx/custom/icon-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";

const CHIP_CLASS =
  "inline-flex h-6 max-w-64 items-center gap-1 rounded-full border border-border bg-secondary px-2 text-secondary-foreground text-xs transition-colors hover:bg-accent";

interface FilterChipProps {
  label: string;
  popover?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  fieldPopoverClassName?: string;
  onEditRequest?: () => void;
  onClear?: () => void;
  children: ReactNode;
}

// 可复用筛选 chip：外层 div 承载样式，内部分为触发按钮与清除按钮，避免 button 嵌套可交互元素
export function FilterChip({
  label,
  popover,
  open,
  onOpenChange,
  fieldPopoverClassName,
  onEditRequest,
  onClear,
  children,
}: FilterChipProps) {
  const clearButton = onClear ? (
    <IconButton
      size="sm"
      tooltip={`清除${label}`}
      aria-label={`清除${label}`}
      className="ml-0.5 size-3.5 p-0 hover:bg-transparent hover:text-foreground"
      onClick={onClear}
    >
      <X className="size-3" />
    </IconButton>
  ) : null;

  if (popover != null) {
    return (
      <div className={CHIP_CLASS}>
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-1"
              />
            }
          >
            {children}
          </PopoverTrigger>
          <PopoverContent
            className={cn(
              "flex max-h-[min(30rem,calc(100vh-8rem))] w-(--anchor-width) min-w-[16rem] max-w-[calc(100vw-2rem)] flex-col p-0",
              fieldPopoverClassName
            )}
            align="start"
          >
            {popover}
          </PopoverContent>
        </Popover>
        {clearButton}
      </div>
    );
  }

  return (
    <div className={CHIP_CLASS}>
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-1"
        onClick={onEditRequest}
      >
        {children}
      </button>
      {clearButton}
    </div>
  );
}
