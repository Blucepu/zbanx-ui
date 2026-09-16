import { useEffect, useSyncExternalStore } from "react";
import type {
  CreatorFilterValues,
  FilterLabelSnapshot,
  NumberRange,
  PersistedCreatorFilterValues,
} from "./types";

/** 通用 where 结构（与后端 CreatorListInputV2 同形，库内不依赖 GQL 类型） */
export interface CreatorListWhere {
  channel?: Record<string, unknown>;
  creator?: Record<string, unknown>;
}

function toIntRange(range?: NumberRange) {
  if (!range || (range.min == null && range.max == null)) return null;
  return { min: range.min ?? null, max: range.max ?? null };
}

function toFloatRangeArray(range?: NumberRange) {
  const value = toIntRange(range);
  return value ? [value] : null;
}

export function buildCreatorListWhere(
  values: CreatorFilterValues
): CreatorListWhere {
  const where: CreatorListWhere = {};

  const channel: Record<string, unknown> = {};
  if (values.country?.length) channel.country = values.country;
  if (values.primaryVerticalCategories?.length)
    channel.primaryVerticalCategories = values.primaryVerticalCategories;
  if (values.influencerCategory?.length)
    channel.verticalCategories = values.influencerCategory;
  if (toIntRange(values.quantity))
    channel.quantity = toIntRange(values.quantity);
  if (toIntRange(values.flow)) channel.flow = toIntRange(values.flow);
  if (toIntRange(values.avgView)) channel.avgView = toIntRange(values.avgView);
  if (values.channelType?.length) channel.channelType = values.channelType;
  if (values.channels) channel.channels = [values.channels];
  if (values.channelUrl) channel.channelUrl = values.channelUrl;
  if (values.email) channel.email = values.email;
  if (values.channelName) channel.channelName = values.channelName;
  if (values.language?.length) channel.language = values.language;
  if (values.contentTypes?.length) channel.contentTypes = values.contentTypes;
  if (values.tagKeyword?.length) channel.tagKeyword = values.tagKeyword;
  if (values.productLines?.length) channel.productLines = values.productLines;
  if (values.projectID?.length) channel.projectID = values.projectID;
  if (values.cooperationModes?.length)
    channel.cooperationModes = values.cooperationModes;
  if (values.eCommerceWebsites?.length)
    channel.eCommerceWebsites = values.eCommerceWebsites;
  if (values.isNew != null) channel.isNew = values.isNew;
  if (values.hasContact != null) channel.hasContact = values.hasContact;
  if (values.isTiktokGo != null) channel.isTiktokGo = values.isTiktokGo;
  if (values.taskIDs?.length) channel.taskIDs = values.taskIDs;
  if (values.official != null) channel.official = values.official;
  if (toIntRange(values.medianView))
    channel.medianView = toIntRange(values.medianView);
  if (toFloatRangeArray(values.avgViewRate))
    channel.avgViewRate = toFloatRangeArray(values.avgViewRate);
  if (toIntRange(values.avgDuration))
    channel.avgDuration = toIntRange(values.avgDuration);
  if (toIntRange(values.avgLike)) channel.avgLike = toIntRange(values.avgLike);
  if (toIntRange(values.avgComment))
    channel.avgComment = toIntRange(values.avgComment);
  if (toIntRange(values.avgShare))
    channel.avgShare = toIntRange(values.avgShare);
  // 均点赞观看指数暂无独立后端字段，以 avgLikeRate 近似
  if (toIntRange(values.avgLikeViewRate))
    channel.avgLikeRate = { ...toIntRange(values.avgLikeViewRate) };
  if (toFloatRangeArray(values.avgEngagementRate))
    channel.avgEngagementRate = toFloatRangeArray(values.avgEngagementRate);
  if (Object.keys(channel).length > 0) where.channel = channel;

  const creator: Record<string, unknown> = {};
  if (values.creatorID) creator.creators = [values.creatorID];
  if (values.gender) creator.gender = values.gender;
  if (values.inBlackList != null) creator.inBlackList = values.inBlackList;
  if (Object.keys(creator).length > 0) where.creator = creator;

  return where;
}

/** 兼容旧名：与 web-pm-im 的 buildCreatorListInputV2 同映射，返回通用 where */
export const buildCreatorListInputV2 = buildCreatorListWhere;

export function mergeLabelSnapshot(
  base: FilterLabelSnapshot | undefined,
  patch: FilterLabelSnapshot
): FilterLabelSnapshot | undefined {
  const out: FilterLabelSnapshot = {};
  for (const source of [base, patch]) {
    if (!source) continue;
    for (const [field, record] of Object.entries(source)) {
      const merged = { ...out[field], ...record };
      if (Object.keys(merged).length > 0) out[field] = merged;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function pruneLabelSnapshot(
  snapshot: FilterLabelSnapshot | undefined,
  values: CreatorFilterValues
): FilterLabelSnapshot | undefined {
  if (!snapshot) return undefined;
  const source = values as Record<string, unknown>;
  const out: FilterLabelSnapshot = {};
  for (const [field, record] of Object.entries(snapshot)) {
    const selected = source[field];
    if (!Array.isArray(selected)) continue;
    const kept: Record<string, string> = {};
    for (const [v, label] of Object.entries(record)) {
      if (selected.includes(v)) kept[v] = label;
    }
    if (Object.keys(kept).length > 0) out[field] = kept;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function stripLabelSnapshot(
  values: PersistedCreatorFilterValues
): CreatorFilterValues {
  const next = { ...values };
  delete next.__labels;
  return next;
}

const panelLabelRegistry = new Map<string, Map<string, string>>();
const panelLabelListeners = new Set<() => void>();
let panelLabelVersion = 0;

function emitPanelLabelsChange(): void {
  panelLabelVersion += 1;
  for (const listener of panelLabelListeners) listener();
}

export function reportPanelLabels(
  field: string,
  entries: Record<string, string>
): void {
  let record = panelLabelRegistry.get(field);
  if (!record) {
    record = new Map();
    panelLabelRegistry.set(field, record);
  }
  let changed = false;
  for (const [value, label] of Object.entries(entries)) {
    if (record.get(value) !== label) {
      record.set(value, label);
      changed = true;
    }
  }
  if (changed) emitPanelLabelsChange();
}

export function usePanelLabelsVersion(): number {
  return useSyncExternalStore(
    (notify) => {
      panelLabelListeners.add(notify);
      return () => {
        panelLabelListeners.delete(notify);
      };
    },
    () => panelLabelVersion,
    () => panelLabelVersion
  );
}

export function readPanelLabels(
  field: string
): Record<string, string> | undefined {
  const record = panelLabelRegistry.get(field);
  if (!record || record.size === 0) return undefined;
  return Object.fromEntries(record);
}

export function useRegisterFieldOptionLabels(
  field: string,
  options: { value: string; label: string }[]
): void {
  useEffect(() => {
    if (options.length === 0) return;
    const record: Record<string, string> = {};
    for (const option of options) record[option.value] = option.label;
    reportPanelLabels(field, record);
  }, [field, options]);
}

export const EMPTY_FILTER_VALUE_LABEL = "空";

export function resolveFilterLabel(
  field: string,
  value: string | null,
  snapshot?: Record<string, string>
): string | undefined {
  if (value == null || value === "") return EMPTY_FILTER_VALUE_LABEL;
  return readPanelLabels(field)?.[value] ?? snapshot?.[value];
}

export function resolveFilterValueLabel(
  field: string,
  value: string | null,
  snapshot?: Record<string, string>
): string {
  return (
    resolveFilterLabel(field, value, snapshot) ??
    (value == null ? EMPTY_FILTER_VALUE_LABEL : value)
  );
}

export function collectPanelLabels(
  values: CreatorFilterValues
): FilterLabelSnapshot {
  const out: FilterLabelSnapshot = {};
  const source = values as Record<string, unknown>;
  for (const [field, value] of Object.entries(source)) {
    if (field === "__labels" || !Array.isArray(value)) continue;
    const record = readPanelLabels(field);
    if (!record) continue;
    const kept: Record<string, string> = {};
    for (const v of value) {
      const raw = String(v);
      const label = record[raw];
      if (label) kept[raw] = label;
    }
    if (Object.keys(kept).length > 0) out[field] = kept;
  }
  return out;
}

export function countActiveCreatorFilters(values: CreatorFilterValues): number {
  return Object.entries(values).filter(([key, value]) => {
    if (key === "__labels") return false;
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object")
      return value.min != null || value.max != null;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  }).length;
}

export function isEmptyCreatorFilters(values: CreatorFilterValues): boolean {
  return countActiveCreatorFilters(values) === 0;
}
