"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  reportPanelLabels,
  resolveFilterValueLabel,
} from "@/registry/zbanx/custom/creator-filter-core/where";
import {
  DataSelect,
  type DataSelectItem,
} from "@/registry/zbanx/custom/data-select";
import {
  type GroupedCheckGroup,
  GroupedCheckPanel,
} from "@/registry/zbanx/custom/grouped-check-panel";

export interface CountryOptionGroup {
  id: string;
  name: string;
  items: { value: string; label: string }[];
}

export interface CountryFilterContentProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  groups?: CountryOptionGroup[];
  counts?: Map<string, number> | Record<string, number>;
  loading?: boolean;
  countsLoading?: boolean;
}

export function CountryFilterContent({
  value = [],
  onChange,
  className,
  groups: rawGroups = [],
  counts,
  loading = false,
  countsLoading = false,
}: CountryFilterContentProps) {
  const groups: GroupedCheckGroup[] = useMemo(() => {
    const getCount = (key: string): number | undefined => {
      if (counts instanceof Map) return counts.get(key.toUpperCase());
      return (counts as Record<string, number> | undefined)?.[
        key.toUpperCase()
      ];
    };
    return rawGroups.map((group) => ({
      id: group.id,
      name: group.name,
      countLoading: countsLoading,
      items: group.items.map((item) => ({
        id: item.value,
        value: item.value,
        label: item.label,
        count: getCount(item.value),
        countLoading: countsLoading,
      })),
    }));
  }, [rawGroups, counts, countsLoading]);

  return (
    <GroupedCheckPanel
      groups={groups}
      selectedValues={value.map((v) => (v === "" ? null : v))}
      onChange={(next) => onChange?.(next.map((v) => (v === null ? "" : v)))}
      loading={loading}
      showEmpty
      searchPlaceholder="搜索国家/地区"
      emptyText="没有匹配的国家"
      className={cn("h-full", className)}
    />
  );
}

interface CountrySelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  labels?: Record<string, string>;
  groups?: CountryOptionGroup[];
  counts?: Map<string, number> | Record<string, number>;
  loading?: boolean;
  countsLoading?: boolean;
}

export function CountrySelect({
  value = [],
  onChange,
  placeholder = "请选择国家/地区",
  disabled = false,
  labels: snapshotLabels,
  groups = [],
  counts,
  loading = false,
  countsLoading = false,
}: CountrySelectProps) {
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  useEffect(() => {
    if (flatItems.length === 0) return;
    const record: Record<string, string> = {};
    for (const item of flatItems) record[item.value] = item.label;
    reportPanelLabels("country", record);
  }, [flatItems]);

  const selectedItems: DataSelectItem<string>[] = (value ?? []).map((v) => ({
    key: v,
    value: v,
    label: resolveFilterValueLabel("country", v, snapshotLabels),
  }));

  return (
    <DataSelect
      selectedItems={selectedItems}
      onChange={(next) => onChange?.(next)}
      placeholder={placeholder}
      disabled={disabled}
      className="cursor-pointer"
      content={
        <CountryFilterContent
          value={value}
          onChange={onChange}
          groups={groups}
          counts={counts}
          loading={loading}
          countsLoading={countsLoading}
        />
      }
    />
  );
}
