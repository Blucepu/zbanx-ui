import {
  CREATOR_FILTER_GROUPS,
  CREATOR_FILTER_TRI_STATE_LABELS,
} from "./groups";
import type { NumberPresetFieldConfig, NumberRange, TriState } from "./types";
import { resolveFilterLabel } from "./where";

const FIELD_PRESET_MAP = new Map<string, NumberPresetFieldConfig>(
  CREATOR_FILTER_GROUPS.flatMap((group) =>
    group.fields
      .filter((field) => field.type === "number-preset" && field.presetConfig)
      .map((field) => [
        field.key,
        field.presetConfig as NumberPresetFieldConfig,
      ])
  )
);

export function formatCompactNumber(value: number, unit = ""): string {
  const suffix = unit || (value >= 1_000_000 ? "M" : value >= 1_000 ? "K" : "");
  const divisor =
    unit === "M" || (!unit && value >= 1_000_000)
      ? 1_000_000
      : unit === "K" || (!unit && value >= 1_000)
        ? 1_000
        : 1;
  const amount = value / divisor;
  const formatted = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(1);
  return `${formatted}${suffix}`;
}

export function formatNumberRange(
  range: NumberRange | undefined,
  unit = ""
): string {
  if (!range || (range.min == null && range.max == null)) return "";
  if (range.min != null && range.max == null)
    return `${formatCompactNumber(range.min, unit)}+`;
  if (range.min == null && range.max != null)
    return `≤${formatCompactNumber(range.max, unit)}`;
  return `${formatCompactNumber(range.min as number, unit)} ~ ${formatCompactNumber(range.max as number, unit)}`;
}

// 筛选值首个标签文案（数组取首项，多余项由 getExtraLabels 展示为 +N）
export function formatValue(
  value: unknown,
  fieldKey: string,
  snapshot: Record<string, string> | undefined
): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    const first = value[0];
    return first == null
      ? null
      : (resolveFilterLabel(fieldKey, String(first), snapshot) ??
          String(first));
  }
  if (typeof value === "boolean") {
    const labels = CREATOR_FILTER_TRI_STATE_LABELS[fieldKey];
    return (value as TriState)
      ? (labels?.true ?? "是")
      : (labels?.false ?? "否");
  }
  if (typeof value === "object") {
    const range = value as NumberRange;
    if (range.min == null && range.max == null) return null;
    const preset = FIELD_PRESET_MAP.get(fieldKey);
    if (preset) {
      const num = range.min ?? range.max;
      if (num == null) return null;
      const option = preset.options.find((item) => item.value === num);
      if (option?.label) return option.label;
      return `${preset.prefix ?? ""}${formatCompactNumber(num)}${preset.suffix ?? ""}`.trim();
    }
    return formatNumberRange(range);
  }
  if (typeof value === "string") {
    if (!value.trim()) return null;
    return resolveFilterLabel(fieldKey, value, snapshot) ?? value;
  }
  if (typeof value === "number") return formatCompactNumber(value);
  return String(value);
}

// 数组值除首项外的剩余标签文案（+N 悬停展示用）
export function getExtraLabels(
  value: unknown,
  fieldKey: string,
  snapshot: Record<string, string> | undefined
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(1)
    .map((v) => resolveFilterLabel(fieldKey, String(v), snapshot) ?? String(v));
}
