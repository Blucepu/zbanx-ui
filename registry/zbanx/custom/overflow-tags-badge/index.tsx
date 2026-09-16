"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";
import { ScrollArea } from "@/registry/zbanx/ui/scroll-area";

/** +N 悬停面板关闭延迟（ms）：为光标在徽标与面板之间移动预留缓冲 */
const OVERFLOW_PANEL_CLOSE_DELAY = 150;

/** 面板最大高度，超出时滚动（两列布局） */
const MAX_PANEL_HEIGHT = 256;

export interface OverflowTagsBadgeProps {
  /** 被聚合隐藏、悬停时展示的条目列表（纯文字展示） */
  items: { key: string; label: string }[];
  /** 徽标样式，由使用方按场景传入 */
  className?: string;
}

/**
 * +N 溢出徽标：悬停展示被隐藏的条目列表。
 * 使用悬停意图控制的 Popover 承载可交互内容：
 * 浮层可悬停、可滚动；徽标与浮层共用同一 open 状态并延迟关闭。
 * 拖拽守卫：浮层内 pointerdown 到全局 pointerup 期间禁止关闭。
 */
export function OverflowTagsBadge({
  items,
  className,
}: OverflowTagsBadgeProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const hoveredRef = useRef(false);
  const draggingRef = useRef(false);
  const [panelHeight, setPanelHeight] = useState<number>();
  const measureContent = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    setPanelHeight(Math.min(node.scrollHeight + 16, MAX_PANEL_HEIGHT));
  }, []);

  const show = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    setOpen(true);
  }, []);
  const scheduleHide = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(
      () => setOpen(false),
      OVERFLOW_PANEL_CLOSE_DELAY
    );
  }, []);

  const handleEnter = () => {
    hoveredRef.current = true;
    show();
  };
  const handleLeave = () => {
    hoveredRef.current = false;
    if (!draggingRef.current) scheduleHide();
  };

  useEffect(() => {
    const handlePointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (!hoveredRef.current) scheduleHide();
    };
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [scheduleHide]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) show();
        else if (!draggingRef.current) scheduleHide();
      }}
    >
      <PopoverTrigger
        nativeButton={false}
        render={
          <span
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center text-xs",
              className
            )}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          />
        }
      >
        +{items.length}
      </PopoverTrigger>
      <PopoverContent
        sideOffset={0}
        className="w-fit max-w-[min(24rem,calc(100vw-2rem))] rounded-md border-none bg-foreground p-0 text-background text-xs shadow-none"
      >
        <PopoverArrow className="bg-foreground" />
        <div
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onPointerDown={() => {
            draggingRef.current = true;
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <ScrollArea className="p-2" style={{ height: panelHeight }}>
            <div
              ref={measureContent}
              className="grid grid-cols-2 gap-x-4 gap-y-0.5 break-all"
            >
              {items.map((item) => (
                <div key={item.key}>{item.label}</div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default OverflowTagsBadge;
