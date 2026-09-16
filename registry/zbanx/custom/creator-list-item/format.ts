import { formatNumber } from "@/lib/number/formation";

/** 格式化达人指标数值，缺省返回 "-"（统一复用 formation formatNumber，en-US → K/M/B） */
export function formatMetric(value?: number | null): string {
  return value == null ? "-" : formatNumber(value);
}

/** 格式化视频发布时间为 YYYY-MM-DD（本地时区，与 dayjs 默认行为一致），缺省返回 "暂无发布时间" */
export function formatVideoDate(value?: string | null): string {
  if (!value) return "暂无发布时间";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "暂无发布时间";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
