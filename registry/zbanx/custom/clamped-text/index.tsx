"use client";

import type * as React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";

const INITIAL_CLAMP_LINES = 1;
const POPOVER_CLOSE_DELAY = 200;

interface ClampedTextProps {
  /** 待展示文本 */
  text: string;
  /** 空文本占位 */
  emptyText?: string;
  /** 应用到内层背景块的类名（背景/内边距/字号等，背景块贴合截断文字高度） */
  className?: string;
  /** 弹层额外类名 */
  popoverContentClassName?: string;
}

export function ClampedText({
  text,
  emptyText = "",
  className,
  popoverContentClassName,
}: ClampedTextProps) {
  const content = text || emptyText;
  const outerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clampLines, setClampLines] = useState<number>(INITIAL_CLAMP_LINES);
  const [truncated, setTruncated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const measure = measureRef.current;
    if (!outer || !measure) return;
    const recalc = () => {
      const available = outer.clientHeight;
      if (available <= 0) return;
      const full = measure.scrollHeight;
      const cs = getComputedStyle(measure);
      const lh = parseFloat(cs.lineHeight) || 20;
      const padY =
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const totalLines = Math.max(1, Math.ceil((full - padY) / lh));
      if (full <= available) {
        setClampLines(totalLines);
        setTruncated(false);
        return;
      }
      setClampLines(Math.max(1, Math.floor((available - padY) / lh)));
      setTruncated(true);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(outer);
    ro.observe(measure);
    return () => ro.disconnect();
  }, []);

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(
      () => setOpen(false),
      POPOVER_CLOSE_DELAY
    );
  };

  const boxStyle: React.CSSProperties = {
    WebkitLineClamp: clampLines,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    overflow: "hidden",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        nativeButton={false}
        render={
          <div
            ref={outerRef}
            className="relative min-h-0 flex-1 overflow-hidden"
            onPointerEnter={
              truncated
                ? () => {
                    cancelClose();
                    setOpen(true);
                  }
                : undefined
            }
            onPointerLeave={truncated ? scheduleClose : undefined}
          />
        }
      >
        {/* 脱离文档流：截断行数变化不影响外层高度，避免与 clientHeight 测量互相反馈震荡 */}
        <div className={cn("absolute inset-x-0 top-0", className)}>
          <p style={boxStyle}>{content}</p>
        </div>
        <div
          ref={measureRef}
          className={cn(
            "pointer-events-none invisible absolute inset-0 overflow-visible",
            className
          )}
          aria-hidden="true"
        >
          <p>{content}</p>
        </div>
      </PopoverTrigger>
      {truncated && (
        <PopoverContent
          align="start"
          sideOffset={4}
          className={cn(
            "w-80 max-w-[calc(100vw-2rem)] p-0",
            popoverContentClassName
          )}
        >
          <div
            className="custom-scrollbar max-h-[min(60vh,24rem)] overflow-y-auto overscroll-contain rounded-md"
            onPointerEnter={cancelClose}
            onPointerLeave={scheduleClose}
          >
            <p className="whitespace-pre-wrap break-words px-3 py-2 text-muted-foreground text-xs leading-5">
              {content}
            </p>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

export default ClampedText;
