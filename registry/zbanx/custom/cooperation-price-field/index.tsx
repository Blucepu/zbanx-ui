"use client";

import { CircleHelp } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";

/** 询价记录（精简结构；与 creator-list-item 的 CreatorPriceInquiry 同形，结构化兼容） */
export interface CreatorPriceInquiry {
  id: string;
  cooperationMode?: string | null;
  cooperationModes?: string[] | null;
  inquiryMin?: number | null;
  inquiryMax?: number | null;
  createdAt?: string | null;
}

/** 格式化询价日期为 YYYY/MM/DD，缺省返回空字符串 */
function formatInquiryDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

const usdFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 格式化美元金额（保留 2 位小数 + USD 后缀），缺省返回 "-" */
function formatUsd(value?: number | null): string {
  return value == null ? "-" : `${usdFormatter.format(value)} USD`;
}

/** 问号弹层自动关闭延迟（毫秒），hover 移出后等待，避免鼠标挪向面板时闪关 */
const POPOVER_CLOSE_DELAY = 200;

interface CooperationPriceFieldProps {
  /** 达人询价记录（展示全部，按时间倒序，最新一条的价格作为主值） */
  inquiries: CreatorPriceInquiry[];
  /** 合作方式 code 转展示名 */
  getModeLabel: (mode?: string) => string;
  /** 布局：row 为列表横行（标签左、值右），stacked 为抽屉竖排（标签上、值下） */
  layout?: "row" | "stacked";
  className?: string;
}

function inquiryTime(value?: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const time = Date.parse(value);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function inquiryMeanPrice(
  min?: number | null,
  max?: number | null
): number | null {
  const values = [min, max].filter((v): v is number => v != null);
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * 合作方式价格行：主值展示最新询价均价，问号悬停展示全部询价记录（深色面板：日期 + 方式 + 单价）
 */
export function CooperationPriceField({
  inquiries,
  getModeLabel,
  layout = "row",
  className,
}: CooperationPriceFieldProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const sorted = [...inquiries].sort(
    (a, b) => inquiryTime(b.createdAt) - inquiryTime(a.createdAt)
  );
  const latest = sorted[0];
  const priceText = formatUsd(
    latest ? inquiryMeanPrice(latest.inquiryMin, latest.inquiryMax) : null
  );

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

  const trigger = sorted.length > 0 && (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="查看历史合作价格"
            className="inline-flex cursor-pointer items-center rounded-sm text-muted-foreground/70 hover:text-muted-foreground focus-visible:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/60"
            onPointerEnter={() => {
              cancelClose();
              setOpen(true);
            }}
            onPointerLeave={scheduleClose}
          />
        }
      >
        <CircleHelp className="size-3.5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-max max-w-[calc(100vw-2rem)] border-transparent bg-zinc-900 p-3 text-white"
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-1.5">
          {sorted.map((item, index) => {
            const mode = item.cooperationMode ?? item.cooperationModes?.[0];
            return (
              <Fragment key={`${item.id}-${index}`}>
                <span
                  className="truncate text-xs leading-5"
                  title={formatInquiryDate(item.createdAt) || undefined}
                >
                  {formatInquiryDate(item.createdAt)}
                </span>
                <span
                  className="min-w-0 truncate text-xs leading-5"
                  title={getModeLabel(mode)}
                >
                  {getModeLabel(mode)}
                </span>
                <span className="shrink-0 text-right text-xs font-medium leading-5 tabular-nums">
                  {formatUsd(
                    inquiryMeanPrice(item.inquiryMin, item.inquiryMax)
                  )}
                </span>
              </Fragment>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (layout === "stacked") {
    return (
      <div className={cn("flex min-w-0 flex-col gap-2", className)}>
        <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
          合作方式
          {trigger}
        </span>
        <span className="truncate text-xs font-medium" title={priceText}>
          {priceText}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid min-h-7 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2",
        className
      )}
    >
      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
        合作方式
        {trigger}
      </span>
      <span className="max-w-28 truncate text-xs font-medium" title={priceText}>
        {priceText}
      </span>
    </div>
  );
}

export default CooperationPriceField;
