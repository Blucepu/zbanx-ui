"use client";

import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type {
  CreatorFilterFieldConfig,
  CreatorFilterOption,
  CreatorFilterValues,
  NumberRange,
  PersistedCreatorFilterValues,
} from "@/registry/zbanx/custom/creator-filter-core/types";
import { resolveFilterValueLabel } from "@/registry/zbanx/custom/creator-filter-core/where";
import {
  DataSelect,
  type DataSelectItem,
} from "@/registry/zbanx/custom/data-select";
import {
  type NumberPresetOption,
  NumberPresetSelect,
} from "@/registry/zbanx/custom/number-preset-select";
import {
  type NumberRangeOption,
  NumberRangeSelect,
} from "@/registry/zbanx/custom/number-range-select";
import { TagInput } from "@/registry/zbanx/custom/tag-input";
import { Button } from "@/registry/zbanx/ui/button";
import { Input } from "@/registry/zbanx/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/zbanx/ui/select";
import { CountrySelect } from "./country-select";
import { CrawlerTaskSelect } from "./crawler-task-select";
import { MultiSelectContent } from "./multi-select-content";
import { ProjectSelect } from "./project-select";
import type { CategoryOptionGroup, CountryOptionGroup } from "./types";
import { VerticalCategorySelect } from "./vertical-category-select";

export const GENDER_OPTIONS = [
  { value: "Male", label: "男" },
  { value: "Female", label: "女" },
  { value: "Neutral", label: "中性" },
  { value: "MaleAndFemale", label: "男女都有" },
  { value: "Unknown", label: "未知" },
];

export const QUANTITY_RANGE_OPTIONS: NumberRangeOption[] = [
  { min: 0, max: 1_000, label: "0-1K", value: "0|1000" },
  { min: 1_000, max: 10_000, label: "1K-10K", value: "1000|10000" },
  { min: 10_000, max: 100_000, label: "10K-100K", value: "10000|100000" },
  { min: 100_000, max: 500_000, label: "100K-500K", value: "100000|500000" },
  { min: 500_000, max: 1_000_000, label: "500K-1M", value: "500000|1000000" },
  { min: 1_000_000, max: 5_000_000, label: "1M-5M", value: "1000000|5000000" },
  {
    min: 5_000_000,
    max: 10_000_000,
    label: "5M-10M",
    value: "5000000|10000000",
  },
  { min: 10_000_000, max: undefined, label: "10M+", value: "10000000|" },
];

export const AVG_VIEW_PRESETS: NumberPresetOption[] = [
  { value: 1_000, label: "1K+" },
  { value: 10_000, label: "10K+" },
  { value: 100_000, label: "100K+" },
  { value: 1_000_000, label: "1M+" },
];

export const DEFAULT_PRESET_CONFIG = {
  options: AVG_VIEW_PRESETS,
  prefix: "",
  suffix: "+",
  inputPlaceholder: "最小值",
};

export interface FieldOptionSources {
  countryGroups?: CountryOptionGroup[];
  countryCounts?: Map<string, number> | Record<string, number>;
  countryLoading?: boolean;
  countryCountsLoading?: boolean;
  categoryGroups?: CategoryOptionGroup[];
  categoryLoading?: boolean;
  projectOptions?: CreatorFilterOption[];
  projectLoading?: boolean;
  projectSearching?: boolean;
  projectFallbackLabels?: Record<string, string>;
  onProjectSearchChange?: (keyword: string) => void;
  taskOptions?: CreatorFilterOption[];
  taskLoading?: boolean;
  taskSearching?: boolean;
  taskFallbackLabels?: Record<string, string>;
  onTaskSearchChange?: (keyword: string) => void;
}

interface CreatorFilterFieldProps {
  field: CreatorFilterFieldConfig;
  values: PersistedCreatorFilterValues;
  onChange: <K extends keyof CreatorFilterValues>(
    key: K,
    value: CreatorFilterValues[K]
  ) => void;
  options?: CreatorFilterOption[];
  optionsLoading?: boolean;
  sources?: FieldOptionSources;
  renderChannelOptionPrefix?: (option: CreatorFilterOption) => ReactNode;
  renderChannelItemIcon?: (value: string) => ReactNode;
}

function toDataSelectItems(
  values: string[] | undefined,
  fieldKey: string,
  renderIcon?: (value: string) => ReactNode,
  snapshot?: Record<string, string>
): DataSelectItem<string>[] {
  return (values ?? []).map((value) => ({
    key: value,
    value,
    label: resolveFilterValueLabel(fieldKey, value, snapshot),
    icon: renderIcon?.(value),
  }));
}

function SelectOptionRow({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={checked}
      tabIndex={0}
      className="relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent"
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="min-w-0 truncate">{label}</span>
      {checked && (
        <span className="absolute right-2 flex size-3.5 items-center justify-center">
          <CheckIcon className="size-4" />
        </span>
      )}
    </div>
  );
}

export function SingleSelectContent({
  options,
  value,
  onChange,
  allLabel = "不限",
}: {
  options: CreatorFilterOption[];
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  allLabel?: string;
}) {
  const items = [{ value: "", label: allLabel }, ...options];
  return (
    <div className="max-h-[min(30rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain p-1">
      {items.map((option) => (
        <SelectOptionRow
          key={option.value || "__all__"}
          label={option.label}
          checked={(value ?? "") === option.value}
          onSelect={() => onChange(option.value || undefined)}
        />
      ))}
    </div>
  );
}

export function TriStateContent({
  value,
  onChange,
  labels,
}: {
  value: boolean | undefined;
  onChange: (next: boolean | undefined) => void;
  labels: { true: string; false: string };
}) {
  const items = [
    {
      key: "all" as const,
      label: "不限",
      val: undefined as boolean | undefined,
    },
    {
      key: "true" as const,
      label: labels.true,
      val: true as boolean | undefined,
    },
    {
      key: "false" as const,
      label: labels.false,
      val: false as boolean | undefined,
    },
  ];
  return (
    <div className="max-h-[min(30rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain p-1">
      {items.map((item) => (
        <SelectOptionRow
          key={item.key}
          label={item.label}
          checked={value === item.val}
          onSelect={() => onChange(item.val)}
        />
      ))}
    </div>
  );
}

/** 文本筛选编辑器：列表 chip 气泡内单行输入，回车/确定应用，清空后确定即清除该条件 */
export function TextFilterEditor({
  value,
  placeholder,
  onChange,
  onApplied,
  normalizeText,
}: {
  value: string | undefined;
  placeholder?: string;
  onChange: (next: string | undefined) => void;
  onApplied?: () => void;
  normalizeText?: (raw: string) => string;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const normalize = (next: string): string =>
    normalizeText ? normalizeText(next) : next.trim();

  const apply = (next: string) => {
    const normalized = normalize(next);
    setDraft(normalized);
    onChange(normalized ? normalized : undefined);
    onApplied?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const normalized = normalize(draft);
          if (normalized !== draft) setDraft(normalized);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") apply(draft);
        }}
        className="focus-visible:border-primary focus-visible:ring-0"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="xs" onClick={onApplied}>
          取消
        </Button>
        <Button type="button" size="xs" onClick={() => apply(draft)}>
          确定
        </Button>
      </div>
    </div>
  );
}

/** 抽屉内文本筛选框（输入即写入草稿，无确定按钮） */
export function TextFilterField({
  value,
  placeholder,
  normalizeText,
  onChange,
}: {
  value: string | undefined;
  placeholder?: string;
  normalizeText?: (raw: string) => string;
  onChange: (next: string | undefined) => void;
}) {
  return (
    <Input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value || undefined)}
      onBlur={() => {
        if (!normalizeText) return;
        const normalized = normalizeText(value ?? "");
        if (normalized !== (value ?? "")) onChange(normalized || undefined);
      }}
      className="focus-visible:border-primary focus-visible:ring-0"
    />
  );
}

/** 标签筛选编辑器：复用 TagInput，确定后应用 */
export function TagFilterEditor({
  value,
  placeholder,
  onChange,
  onApplied,
}: {
  value: string[] | undefined;
  placeholder?: string;
  onChange: (next: string[]) => void;
  onApplied?: () => void;
}) {
  const [draft, setDraft] = useState(value ?? []);

  useEffect(() => {
    setDraft(value ?? []);
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <TagInput
        value={draft}
        onChange={setDraft}
        placeholder={placeholder}
        className="h-9"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="xs" onClick={onApplied}>
          取消
        </Button>
        <Button
          type="button"
          size="xs"
          onClick={() => {
            onChange(draft);
            onApplied?.();
          }}
        >
          确定
        </Button>
      </div>
    </div>
  );
}

export default function CreatorFilterField({
  field,
  values,
  onChange,
  options = [],
  optionsLoading,
  sources,
  renderChannelOptionPrefix,
  renderChannelItemIcon,
}: CreatorFilterFieldProps) {
  const key = field.key;

  if (field.unsupported) {
    return (
      <Input
        disabled
        placeholder="暂不支持后端筛选"
        title="creatorChannelListV2 暂未提供该字段的筛选参数"
        className="cursor-not-allowed"
      />
    );
  }

  switch (field.type) {
    case "multi-select": {
      if (key === "country") {
        return (
          <CountrySelect
            value={(values[key] as string[] | undefined) ?? []}
            onChange={(next) => onChange(key, next as never)}
            placeholder={field.placeholder}
            labels={values.__labels?.[key]}
            groups={sources?.countryGroups}
            counts={sources?.countryCounts}
            loading={sources?.countryLoading}
            countsLoading={sources?.countryCountsLoading}
          />
        );
      }
      if (key === "influencerCategory" || key === "primaryVerticalCategories") {
        return (
          <VerticalCategorySelect
            fieldKey={key}
            value={(values[key] as string[] | undefined) ?? []}
            onChange={(next) => onChange(key, next as never)}
            placeholder={field.placeholder}
            labels={values.__labels?.[key]}
            groups={sources?.categoryGroups}
            loading={sources?.categoryLoading}
          />
        );
      }
      if (key === "taskIDs") {
        return (
          <CrawlerTaskSelect
            value={(values[key] as string[] | undefined) ?? []}
            onChange={(next) => onChange(key, next as never)}
            placeholder={field.placeholder}
            labels={values.__labels?.[key]}
            options={sources?.taskOptions}
            loading={sources?.taskLoading}
            searching={sources?.taskSearching}
            fallbackLabels={sources?.taskFallbackLabels}
            onSearchChange={sources?.onTaskSearchChange}
          />
        );
      }
      if (key === "projectID") {
        return (
          <ProjectSelect
            value={(values[key] as string[] | undefined) ?? []}
            onChange={(next) => onChange(key, next as never)}
            placeholder={field.placeholder}
            labels={values.__labels?.[key]}
            options={sources?.projectOptions}
            loading={sources?.projectLoading}
            searching={sources?.projectSearching}
            fallbackLabels={sources?.projectFallbackLabels}
            onSearchChange={sources?.onProjectSearchChange}
          />
        );
      }
      const selectedValues = (values[key] as string[] | undefined) ?? [];
      return (
        <DataSelect
          selectedItems={toDataSelectItems(
            selectedValues,
            key,
            key === "channelType" ? renderChannelItemIcon : undefined,
            values.__labels?.[key]
          )}
          onChange={(next) => onChange(key, next as never)}
          placeholder={field.placeholder}
          className="cursor-pointer"
          content={
            <MultiSelectContent
              options={options}
              selectedValues={selectedValues}
              onChange={(next) => onChange(key, next as never)}
              loading={optionsLoading}
              searchPlaceholder={field.placeholder}
              renderOptionPrefix={
                key === "channelType" ? renderChannelOptionPrefix : undefined
              }
              showEmpty={key === "language"}
            />
          }
        />
      );
    }
    case "tag-input":
      return (
        <TagInput
          value={(values[key] as string[] | undefined) ?? []}
          onChange={(next) => onChange(key, next as never)}
          placeholder={field.placeholder}
          className="h-9"
        />
      );
    case "text":
      return (
        <TextFilterField
          value={values[key] as string | undefined}
          placeholder={field.placeholder}
          normalizeText={field.normalizeText}
          onChange={(next) => onChange(key, next as never)}
        />
      );
    case "number-range": {
      const range = (values[key] as NumberRange | undefined) ?? {};
      const isQuantity = key === "quantity" || key === "flow";
      return (
        <NumberRangeSelect
          value={range}
          options={isQuantity ? QUANTITY_RANGE_OPTIONS : []}
          onChange={(next) => onChange(key, (next ?? undefined) as never)}
          placeholder="请选择范围"
          unit={isQuantity ? "K" : ""}
          className="cursor-pointer"
        />
      );
    }
    case "number-preset": {
      const range = values[key] as NumberRange | undefined;
      const config = field.presetConfig ?? DEFAULT_PRESET_CONFIG;
      return (
        <NumberPresetSelect
          value={range?.min}
          options={config.options}
          onChange={(next) =>
            onChange(key, (next == null ? undefined : { min: next }) as never)
          }
          placeholder="不限"
          prefix={config.prefix}
          suffix={config.suffix}
          inputPlaceholder={config.inputPlaceholder}
          className="cursor-pointer"
        />
      );
    }
    case "tri-state": {
      const current = values[key] as boolean | undefined;
      const selectValue = current == null ? "all" : String(current);
      return (
        <Select
          value={selectValue}
          onValueChange={(next) =>
            onChange(
              key,
              (next === "all" ? undefined : next === "true") as never
            )
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="不限" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">不限</SelectItem>
            <SelectItem value="true">
              {field.triStateLabels?.true ?? "是"}
            </SelectItem>
            <SelectItem value="false">
              {field.triStateLabels?.false ?? "否"}
            </SelectItem>
          </SelectContent>
        </Select>
      );
    }
    case "single-select": {
      const current = (values[key] as string | undefined) ?? "all";
      return (
        <Select
          value={current}
          onValueChange={(next) =>
            onChange(key, (next === "all" ? undefined : next) as never)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">不限</SelectItem>
            {GENDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    default:
      return null;
  }
}
