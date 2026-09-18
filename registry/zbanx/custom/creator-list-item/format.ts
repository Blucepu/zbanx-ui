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

/** 格式化询价日期为 YYYY/MM/DD，缺省返回空字符串 */
export function formatInquiryDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export function formatQuoteDate(value?: string | null): string {
  if (!value) return "日期未知";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "日期未知";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 相对时间（中文，与 dayjs relativeTime zh-cn 口径对齐：未来时间按 0 处理）。
 * 缺省返回 "未知"。
 */
export function formatRelativeTime(value?: string | null): string {
  if (!value) return "未知";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "未知";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSeconds < 45) return "几秒前";
  if (diffSeconds < 90) return "1 分钟前";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 45) return `${diffMinutes} 分钟前`;
  if (diffMinutes < 90) return "1 小时前";
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 22) return `${diffHours} 小时前`;
  if (diffHours < 36) return "1 天前";
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 26) return `${diffDays} 天前`;
  if (diffDays < 45) return "1 个月前";
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 11) return `${diffMonths} 个月前`;
  if (diffDays < 548) return "1 年前";
  return `${Math.floor(diffDays / 365)} 年前`;
}

export function formatQuoteAmount(
  min?: number | null,
  max?: number | null
): string {
  if (min == null && max == null) return "-";
  const lo = min ?? max;
  const hi = max ?? min;
  if (lo == null || hi == null) return "-";
  const [lower, upper] = lo <= hi ? [lo, hi] : [hi, lo];
  const lowerText = `$${formatNumber(lower, { autoFormat: false })}`;
  if (lower === upper) return lowerText;
  return `${lowerText} - $${formatNumber(upper, { autoFormat: false })}`;
}

const cpmFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
});

/** 格式化历史 CPM 金额（纯数字、最多 2 位小数，不用 K/M/B 缩写），缺省返回 "-" */
export function formatCpm(value?: number | null): string {
  return value == null ? "-" : cpmFormatter.format(value);
}

const usdFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 格式化美元金额（保留 2 位小数 + USD 后缀），缺省返回 "-" */
export function formatUsd(value?: number | null): string {
  return value == null ? "-" : `${usdFormatter.format(value)} USD`;
}
