"use client";

import { X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { OverflowTagsBadge } from "@/registry/zbanx/custom/overflow-tags-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/zbanx/ui/tooltip";

/**
 * 将输入文本按逗号（中英文）、分号或空白（空格/换行/制表符）拆分为多个条目
 */
export function splitTagInput(value: string): string[] {
  return value
    .split(/[\s,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface TagInputRef {
  focus: () => void;
}

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  /** 校验失败态（红色边框） */
  invalid?: boolean;
  className?: string;
  /** 单个 tag 文本最大展示宽度（超出截断，悬停展示完整内容） */
  tagMaxWidth?: number;
}

/** tag 徽标统一样式（与 DataSelect 已选项展示保持一致） */
const TAG_CHIP_CLASS =
  "rounded border border-border bg-secondary pl-1.5 pr-1 text-secondary-foreground text-xs";

const GAP = 4;
const PADDING_X = 12;
const INPUT_RESERVE = 32;
const PLUS_BADGE_WIDTH = 34;

export const TagInput = forwardRef<TagInputRef, TagInputProps>(
  function TagInput(
    {
      value,
      onChange,
      disabled,
      placeholder,
      invalid,
      className,
      tagMaxWidth = 180,
    },
    ref
  ) {
    const [inputValue, setInputValue] = useState("");
    const [focused, setFocused] = useState(false);
    const [visibleCount, setVisibleCount] = useState(value.length);
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(
      ref,
      () => ({ focus: () => inputRef.current?.focus() }),
      []
    );

    const commit = useCallback(
      (raw: string) => {
        const items = splitTagInput(raw);
        setInputValue("");
        if (items.length === 0) return;
        const existing = new Set(value);
        const additions: string[] = [];
        for (const item of items) {
          if (!existing.has(item)) {
            existing.add(item);
            additions.push(item);
          }
        }
        if (additions.length > 0) onChange([...value, ...additions]);
      },
      [value, onChange]
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: value 变化后测量层会重新渲染 tag，需要重新测量宽度
    useLayoutEffect(() => {
      const container = containerRef.current;
      const measure = measureRef.current;
      if (!container || !measure) return;
      const compute = () => {
        const tagEls = Array.from(measure.children) as HTMLElement[];
        const total = tagEls.length;
        const base = container.clientWidth - PADDING_X;
        const inputReserve = total > 0 ? INPUT_RESERVE : 0;
        const fitCount = (available: number) => {
          let used = 0;
          let count = 0;
          for (const el of tagEls) {
            const width = el.offsetWidth + GAP;
            if (used + width > available) break;
            used += width;
            count += 1;
          }
          return count;
        };
        let count = fitCount(base - inputReserve);
        if (count < total) {
          count = fitCount(base - inputReserve - PLUS_BADGE_WIDTH);
        }
        if (total > 0 && count === 0) count = 1;
        setVisibleCount(count);
      };
      compute();
      const observer = new ResizeObserver(compute);
      observer.observe(container);
      return () => observer.disconnect();
    }, [value]);

    const visibleTags = value.slice(0, visibleCount);
    const hiddenTags = value.slice(visibleCount);

    const removeTag = (url: string) => {
      onChange(value.filter((item) => item !== url));
    };

    return (
      <div
        ref={containerRef}
        className={cn(
          "border-input group relative flex h-8 w-full cursor-text items-center overflow-hidden rounded-md border bg-transparent px-1.5 text-sm shadow-xs transition-[color,box-shadow]",
          invalid
            ? "border-destructive ring-destructive/20"
            : focused && "border-primary",
          disabled && "pointer-events-none cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute inset-y-0 left-0 flex items-center gap-1 whitespace-nowrap px-1.5"
        >
          {value.map((url) => (
            <span
              key={url}
              className={cn(
                "inline-flex h-5 shrink-0 items-center gap-0.5",
                TAG_CHIP_CLASS
              )}
              style={{ maxWidth: tagMaxWidth + 24 }}
            >
              <span className="truncate" style={{ maxWidth: tagMaxWidth }}>
                {url}
              </span>
              <span className="inline-flex size-3 shrink-0 items-center justify-center">
                <X className="size-3" />
              </span>
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          {visibleTags.map((url) => (
            <Tooltip key={url}>
              <TooltipTrigger
                render={
                  <span
                    className={cn(
                      "flex h-5 min-w-0 shrink-0 cursor-pointer items-center gap-0.5",
                      TAG_CHIP_CLASS
                    )}
                    style={{ maxWidth: tagMaxWidth + 24 }}
                  />
                }
              >
                <span className="min-w-0 truncate">{url}</span>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`移除 ${url}`}
                    className="shrink-0 cursor-pointer rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeTag(url);
                    }}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent className="max-w-72 break-all">
                {url}
              </TooltipContent>
            </Tooltip>
          ))}

          {hiddenTags.length > 0 && (
            <OverflowTagsBadge
              className="h-5 rounded border border-border bg-secondary px-1.5 text-secondary-foreground"
              items={hiddenTags.map((url) => ({ key: url, label: url }))}
            />
          )}

          <input
            ref={inputRef}
            value={inputValue}
            disabled={disabled}
            placeholder={value.length === 0 ? placeholder : ""}
            className="placeholder:text-muted-foreground h-6 min-w-8 flex-1 bg-transparent text-sm outline-none"
            onChange={(event) => setInputValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              commit(inputValue);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === "," ||
                event.key === " " ||
                event.key === "，"
              ) {
                event.preventDefault();
                commit(inputValue);
              } else if (
                event.key === "Backspace" &&
                inputValue === "" &&
                value.length > 0
              ) {
                onChange(value.slice(0, -1));
              }
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text");
              if (splitTagInput(text).length > 1) {
                event.preventDefault();
                commit(text);
              }
            }}
          />
        </div>

        {value.length > 0 && !disabled && (
          <button
            type="button"
            aria-label="清除全部"
            title="清除全部"
            className="text-slate-400 hover:text-slate-600 bg-background pointer-events-none absolute top-1/2 right-1 z-10 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              onChange([]);
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    );
  }
);

export default TagInput;
