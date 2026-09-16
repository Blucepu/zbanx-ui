"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CreatorFilterFieldKey } from "@/registry/zbanx/custom/creator-filter-core/types";
import {
  reportPanelLabels,
  resolveFilterLabel,
} from "@/registry/zbanx/custom/creator-filter-core/where";
import {
  DataSelect,
  type DataSelectItem,
} from "@/registry/zbanx/custom/data-select";
import {
  type GroupedCheckGroup,
  GroupedCheckPanel,
} from "@/registry/zbanx/custom/grouped-check-panel";

export interface CategoryOptionGroup {
  id: string;
  name: string;
  items: { value: string; label: string; count?: number }[];
}

export interface VerticalCategoryFilterContentProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  fieldKey: CreatorFilterFieldKey;
  groups?: CategoryOptionGroup[];
  loading?: boolean;
}

export function VerticalCategoryFilterContent({
  value = [],
  onChange,
  className,
  fieldKey,
  groups: rawGroups = [],
  loading = false,
}: VerticalCategoryFilterContentProps) {
  const flatItems = useMemo(
    () => rawGroups.flatMap((group) => group.items),
    [rawGroups]
  );
  useEffect(() => {
    if (flatItems.length === 0) return;
    const record: Record<string, string> = {};
    for (const option of flatItems) record[option.value] = option.label;
    reportPanelLabels(fieldKey, record);
  }, [fieldKey, flatItems]);

  const groups: GroupedCheckGroup[] = useMemo(
    () =>
      rawGroups.map((group) => ({
        id: group.id,
        name: group.name,
        items: group.items.map((item) => ({
          id: item.value,
          value: item.value,
          label: item.label,
          count: item.count,
        })),
      })),
    [rawGroups]
  );

  return (
    <GroupedCheckPanel
      groups={groups}
      selectedValues={value}
      onChange={(next) =>
        onChange?.(next.filter((v): v is string => v !== null))
      }
      loading={loading}
      searchPlaceholder="搜索行业类目"
      emptyText="没有匹配的行业类目"
      className={cn("h-full", className)}
    />
  );
}

interface VerticalCategorySelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  labels?: Record<string, string>;
  fieldKey: CreatorFilterFieldKey;
  groups?: CategoryOptionGroup[];
  loading?: boolean;
}

export function VerticalCategorySelect({
  value = [],
  onChange,
  placeholder = "请选择行业类目",
  disabled = false,
  labels: snapshotLabels,
  fieldKey,
  groups = [],
  loading = false,
}: VerticalCategorySelectProps) {
  const flatItems = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  );
  useEffect(() => {
    if (flatItems.length === 0) return;
    const record: Record<string, string> = {};
    for (const option of flatItems) record[option.value] = option.label;
    reportPanelLabels(fieldKey, record);
  }, [fieldKey, flatItems]);

  const selectedItems: DataSelectItem<string>[] = (value ?? []).map((v) => ({
    key: v,
    value: v,
    label: resolveFilterLabel(fieldKey, v, snapshotLabels) ?? v,
  }));

  return (
    <DataSelect
      selectedItems={selectedItems}
      onChange={(next) => onChange?.(next)}
      placeholder={placeholder}
      disabled={disabled}
      className="cursor-pointer"
      content={
        <VerticalCategoryFilterContent
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          groups={groups}
          loading={loading}
        />
      }
    />
  );
}
