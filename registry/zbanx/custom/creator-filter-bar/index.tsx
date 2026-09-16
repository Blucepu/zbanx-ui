"use client";

import { Pin } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  formatValue,
  getExtraLabels,
} from "@/registry/zbanx/custom/creator-filter-core/format";
import { CREATOR_FILTER_GROUPS } from "@/registry/zbanx/custom/creator-filter-core/groups";
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
  /** 标签来源（独立使用时传入已加载选项，用于 Chip 回显；search-list 内已统一预取） */
  labelSources?: FilterValueLabelSources;
  /** 筛选恢复完成前展示骨架占位，避免空闪 */
  loading?: boolean;
}

// 列表头统一筛选项单行：固定项（无值也常驻占位）在前，非固定有值项按配置顺序紧随
export default function FilterChipsBar({
  values,
  onChange,
  onClearAll,
  onEditRequest,
  renderFieldPopover,
  fieldPopoverClassName,
  renderChannelIcon,
  labelSources,
  loading,
}: FilterChipsBarProps) {
  usePanelLabelsVersion();
  useFilterValueLabels(labelSources);
  const snapshotLabels = values.__labels;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pinnedFields = useMemo(
    () =>
      CREATOR_FILTER_GROUPS.flatMap((group) => group.fields).filter(
        (field) => field.pin
      ),
    []
  );
  const otherEntries = useMemo(
    () =>
      CREATOR_FILTER_GROUPS.flatMap((group) => group.fields)
        .filter((field) => !field.pin)
        .flatMap((field) => {
          const value = (values as Record<string, unknown>)[field.key];
          const fieldSnapshot = snapshotLabels?.[field.key];
          const text = formatValue(value, field.key, fieldSnapshot);
          if (!text) return [];
          const extraLabels = getExtraLabels(value, field.key, fieldSnapshot);
          return [
            {
              key: field.key,
              label: field.label,
              text,
              extraCount: extraLabels.length,
              extraLabels,
              firstValue:
                Array.isArray(value) && value.length > 0
                  ? String(value[0])
                  : null,
            },
          ];
        }),
    [values, snapshotLabels]
  );
  const activeCount = countActiveCreatorFilters(values);

  if (loading) {
    return (
      <div
        className="flex min-w-0 flex-wrap items-center gap-1.5"
        aria-hidden="true"
      >
        {pinnedFields.map((field) => (
          <span
            key={field.key}
            className="h-6 w-24 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
    );
  }

  const closePopover = () => setOpenKey(null);

  return (
    <div className="flex min-w-0 flex-wrap items-start gap-1.5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {pinnedFields.map((field) => {
          const key = field.key;
          const fieldSnapshot = snapshotLabels?.[key];
          const rawValue = (values as Record<string, unknown>)[key];
          const text = formatValue(rawValue, key, fieldSnapshot);
          const extraLabels = text
            ? getExtraLabels(rawValue, key, fieldSnapshot)
            : [];
          const firstValue =
            text && Array.isArray(rawValue) && rawValue.length > 0
              ? String(rawValue[0])
              : null;
          const popover = renderFieldPopover?.(key, closePopover);
          return (
            <FilterChip
              key={key}
              label={field.label}
              popover={popover}
              open={openKey === key}
              onOpenChange={(open) => setOpenKey(open ? String(key) : null)}
              fieldPopoverClassName={fieldPopoverClassName?.(key)}
              onEditRequest={popover == null ? onEditRequest : undefined}
              onClear={
                text
                  ? () => onChange({ ...values, [key]: undefined })
                  : undefined
              }
            >
              <span
                title="已固定在列表头"
                className="inline-flex shrink-0 items-center text-muted-foreground"
                aria-hidden="true"
              >
                <Pin className="size-3 rotate-45" />
              </span>
              <span className="shrink-0 text-muted-foreground">
                {field.label}：
              </span>
              {key === "channelType" && firstValue && renderChannelIcon
                ? renderChannelIcon(firstValue)
                : null}
              <span
                className={cn(
                  "truncate",
                  text ? "font-medium" : "text-muted-foreground"
                )}
                title={text ?? field.placeholder ?? "不限"}
              >
                {text ?? field.placeholder ?? "不限"}
              </span>
              {extraLabels.length > 0 && (
                <OverflowTagsBadge
                  className="rounded bg-muted px-1 font-normal text-muted-foreground"
                  items={extraLabels.map((label, index) => ({
                    key: String(index),
                    label,
                  }))}
                />
              )}
            </FilterChip>
          );
        })}
        {otherEntries.map((entry) => {
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
              onClear={() => onChange({ ...values, [entry.key]: undefined })}
            >
              <span className="shrink-0 text-muted-foreground">
                {entry.label}：
              </span>
              {entry.key === "channelType" &&
              entry.firstValue &&
              renderChannelIcon
                ? renderChannelIcon(entry.firstValue)
                : null}
              <span className="truncate font-medium" title={entry.text}>
                {entry.text}
              </span>
              {entry.extraCount > 0 && (
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
