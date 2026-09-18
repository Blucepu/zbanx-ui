"use client";

import { type ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  formatValue,
  getExtraLabels,
} from "@/registry/zbanx/custom/creator-filter-core/format";
import { CREATOR_FILTER_GROUPS } from "@/registry/zbanx/custom/creator-filter-core/groups";
import {
  resolvePinnedKeys,
  togglePinnedKeys,
} from "@/registry/zbanx/custom/creator-filter-core/pinned";
import type {
  CreatorFilterFieldKey,
  CreatorFilterValues,
  PersistedCreatorFilterValues,
} from "@/registry/zbanx/custom/creator-filter-core/types";
import {
  countActiveCreatorFilters,
  usePanelLabelsVersion,
} from "@/registry/zbanx/custom/creator-filter-core/where";
import {
  type FilterValueLabelSources,
  useFilterValueLabels,
} from "@/registry/zbanx/custom/creator-filter-ui/use-filter-value-labels";
import { OverflowTagsBadge } from "@/registry/zbanx/custom/overflow-tags-badge";
import { Button } from "@/registry/zbanx/ui/button";
import { Separator } from "@/registry/zbanx/ui/separator";
import { FilterChip } from "./filter-chip";

interface FilterChipsBarProps {
  values: PersistedCreatorFilterValues;
  onChange: (values: CreatorFilterValues) => void;
  onClearAll: () => void;
  onEditRequest?: () => void;
  renderFieldPopover?: (
    key: CreatorFilterFieldKey,
    close: () => void
  ) => ReactNode | null;
  fieldPopoverClassName?: (key: CreatorFilterFieldKey) => string | undefined;
  renderChannelIcon?: (value: string) => ReactNode;
  /** 固定在列表头的字段（默认按 values.__pinned 解析，无则回退各字段 pin 配置） */
  pinnedKeys?: CreatorFilterFieldKey[];
  /** 切换固定（默认直接改 values.__pinned 并经 onChange 透出） */
  onTogglePin?: (key: CreatorFilterFieldKey) => void;
  /** 标签来源（独立使用时传入已加载选项，用于 Chip 回显；search-list 内已统一预取） */
  labelSources?: FilterValueLabelSources;
  /** 筛选恢复完成前展示骨架占位，避免空闪 */
  loading?: boolean;
}

export default function FilterChipsBar({
  values,
  onChange,
  onClearAll,
  onEditRequest,
  renderFieldPopover,
  fieldPopoverClassName,
  renderChannelIcon,
  pinnedKeys,
  onTogglePin,
  labelSources,
  loading,
}: FilterChipsBarProps) {
  usePanelLabelsVersion();
  useFilterValueLabels(labelSources);
  const snapshotLabels = values.__labels;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const effectivePinnedKeys = useMemo(
    () => resolvePinnedKeys(pinnedKeys ?? values.__pinned),
    [pinnedKeys, values.__pinned]
  );
  const pinnedKeySet = useMemo(
    () => new Set(effectivePinnedKeys),
    [effectivePinnedKeys]
  );
  const orderedEntries = useMemo(
    () =>
      CREATOR_FILTER_GROUPS.flatMap((group) => group.fields).flatMap(
        (field) => {
          const pinned = pinnedKeySet.has(field.key);
          const value = (values as Record<string, unknown>)[field.key];
          const fieldSnapshot = snapshotLabels?.[field.key];
          const text = formatValue(value, field.key, fieldSnapshot);
          if (!pinned && !text) return [];
          const extraLabels = text
            ? getExtraLabels(value, field.key, fieldSnapshot)
            : [];
          return [
            {
              key: field.key,
              label: field.label,
              placeholder: field.placeholder,
              pinned,
              text,
              extraLabels,
              firstValue:
                text && Array.isArray(value) && value.length > 0
                  ? String(value[0])
                  : null,
            },
          ];
        }
      ),
    [values, snapshotLabels, pinnedKeySet]
  );
  const activeCount = countActiveCreatorFilters(values);

  if (loading) {
    return (
      <div
        className="flex min-w-0 flex-wrap items-center gap-1.5"
        aria-hidden="true"
      >
        {effectivePinnedKeys.map((key) => (
          <span
            key={key}
            className="h-6 w-24 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
    );
  }

  const closePopover = () => setOpenKey(null);
  const handleTogglePin = (key: CreatorFilterFieldKey) => {
    if (onTogglePin) {
      onTogglePin(key);
      return;
    }
    const next: PersistedCreatorFilterValues = {
      ...values,
      __pinned: togglePinnedKeys(resolvePinnedKeys(values.__pinned), key),
    };
    onChange(next);
  };

  return (
    <div className="flex min-w-0 flex-wrap items-start gap-1.5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {orderedEntries.map((entry) => {
          const popover = renderFieldPopover?.(entry.key, closePopover);
          return (
            <FilterChip
              key={entry.key}
              label={entry.label}
              popover={popover}
              open={openKey === entry.key}
              onOpenChange={(open) =>
                setOpenKey(open ? String(entry.key) : null)
              }
              fieldPopoverClassName={fieldPopoverClassName?.(entry.key)}
              onEditRequest={popover == null ? onEditRequest : undefined}
              onClear={
                entry.text
                  ? () => onChange({ ...values, [entry.key]: undefined })
                  : undefined
              }
              pinned={entry.pinned}
              onTogglePin={() => handleTogglePin(entry.key)}
            >
              <span className="shrink-0 text-muted-foreground">
                {entry.label}：
              </span>
              {entry.key === "channelType" &&
              entry.firstValue &&
              renderChannelIcon
                ? renderChannelIcon(entry.firstValue)
                : null}
              <span
                className={cn(
                  "min-w-0 truncate",
                  entry.text ? "font-medium" : "text-muted-foreground"
                )}
                title={entry.text ?? entry.placeholder ?? "不限"}
              >
                {entry.text ?? entry.placeholder ?? "不限"}
              </span>
              {entry.extraLabels.length > 0 && (
                <OverflowTagsBadge
                  className="rounded bg-muted px-1 font-normal text-muted-foreground"
                  items={entry.extraLabels.map((label, index) => ({
                    key: String(index),
                    label,
                  }))}
                />
              )}
            </FilterChip>
          );
        })}
      </div>
      {activeCount > 0 && (
        <div className="flex shrink-0 items-center gap-2 py-0.5">
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-muted-foreground text-xs"
            onClick={onClearAll}
          >
            清除全部（{activeCount}）
          </Button>
        </div>
      )}
    </div>
  );
}

export { FilterChip };
