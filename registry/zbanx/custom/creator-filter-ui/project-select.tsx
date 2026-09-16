"use client";

import { useEffect, useState } from "react";
import type { CreatorFilterOption } from "@/registry/zbanx/custom/creator-filter-core/types";
import {
  reportPanelLabels,
  resolveFilterLabel,
} from "@/registry/zbanx/custom/creator-filter-core/where";
import {
  DataSelect,
  type DataSelectItem,
} from "@/registry/zbanx/custom/data-select";
import { MultiSelectContent } from "./multi-select-content";

export interface ProjectFilterContentProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  options?: CreatorFilterOption[];
  loading?: boolean;
  searching?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (keyword: string) => void;
}

export function ProjectFilterContent({
  value = [],
  onChange,
  options = [],
  loading = false,
  searching = false,
  searchPlaceholder = "搜索合作项目",
  onSearchChange,
}: ProjectFilterContentProps) {
  const [keyword, setKeyword] = useState("");
  const handleSearchChange = (next: string) => {
    setKeyword(next);
    onSearchChange?.(next);
  };

  return (
    <MultiSelectContent
      options={options}
      selectedValues={value}
      onChange={(next) => onChange?.(next)}
      loading={loading}
      searching={searching}
      searchValue={keyword}
      onSearchChange={handleSearchChange}
      searchPlaceholder={searchPlaceholder}
    />
  );
}

interface ProjectSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  labels?: Record<string, string>;
  options?: CreatorFilterOption[];
  loading?: boolean;
  searching?: boolean;
  /** 已选但选项列表中缺失时的回退标签（如调用方已缓存项目名） */
  fallbackLabels?: Record<string, string>;
  onSearchChange?: (keyword: string) => void;
}

export function ProjectSelect({
  value = [],
  onChange,
  placeholder = "请选择合作项目",
  disabled = false,
  labels: snapshotLabels,
  options = [],
  loading = false,
  searching = false,
  fallbackLabels,
  onSearchChange,
}: ProjectSelectProps) {
  useEffect(() => {
    if (options.length === 0) return;
    const record: Record<string, string> = {};
    for (const o of options) record[o.value] = o.label;
    reportPanelLabels("projectID", record);
  }, [options]);

  const selectedItems: DataSelectItem<string>[] = (value ?? []).map((v) => ({
    key: v,
    value: v,
    label:
      resolveFilterLabel("projectID", v, snapshotLabels) ??
      fallbackLabels?.[v] ??
      options.find((o) => o.value === v)?.label ??
      v,
  }));

  return (
    <DataSelect
      selectedItems={selectedItems}
      onChange={(next) => onChange?.(next)}
      placeholder={placeholder}
      disabled={disabled}
      className="cursor-pointer"
      content={
        <ProjectFilterContent
          value={value}
          onChange={onChange}
          options={options}
          loading={loading}
          searching={searching}
          searchPlaceholder={placeholder}
          onSearchChange={onSearchChange}
        />
      }
    />
  );
}
