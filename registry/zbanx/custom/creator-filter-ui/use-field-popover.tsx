"use client";

import { type ReactNode, useMemo } from "react";
import { CREATOR_FILTER_GROUPS } from "@/registry/zbanx/custom/creator-filter-core/groups";
import type {
  CreatorFilterFieldConfig,
  CreatorFilterOption,
  CreatorFilterValues,
  NumberRange,
} from "@/registry/zbanx/custom/creator-filter-core/types";
import { NumberPresetEditor } from "@/registry/zbanx/custom/number-preset-select";
import { NumberRangeEditor } from "@/registry/zbanx/custom/number-range-select";
import { CountryFilterContent } from "./country-select";
import { CrawlerTaskFilterContent } from "./crawler-task-select";
import {
  AVG_VIEW_PRESETS,
  DEFAULT_PRESET_CONFIG,
  type FieldOptionSources,
  GENDER_OPTIONS,
  QUANTITY_RANGE_OPTIONS,
  SingleSelectContent,
  TagFilterEditor,
  TextFilterEditor,
  TriStateContent,
} from "./creator-filter-field";
import { MultiSelectContent } from "./multi-select-content";
import { ProjectFilterContent } from "./project-select";
import { VerticalCategoryFilterContent } from "./vertical-category-select";

const FIELD_TYPE_MAP = new Map<string, string>(
  CREATOR_FILTER_GROUPS.flatMap((group) =>
    group.fields.map((field) => [field.key, field.type])
  )
);

const FIELD_CONFIG_MAP = new Map<string, CreatorFilterFieldConfig>(
  CREATOR_FILTER_GROUPS.flatMap((group) =>
    group.fields.map((field) => [field.key, field])
  )
);

const NARROW_POPOVER_CLASS = "w-auto min-w-[8rem]";
const TAG_POPOVER_CLASS = "min-w-[20rem]";

export function getFieldPopoverClassName(
  key: keyof CreatorFilterValues
): string | undefined {
  const type = FIELD_TYPE_MAP.get(key);
  if (type === "single-select" || type === "tri-state")
    return NARROW_POPOVER_CLASS;
  if (type === "tag-input") return TAG_POPOVER_CLASS;
  return undefined;
}

export interface FieldPopoverSources extends FieldOptionSources {
  multiSelectOptionsMap?: Record<
    string,
    { options: CreatorFilterOption[]; isLoading: boolean; placeholder: string }
  >;
}

export function useFieldPopover(
  filters: CreatorFilterValues,
  patchFilters: (patch: Partial<CreatorFilterValues>) => void,
  sources?: FieldPopoverSources & {
    renderChannelOptionPrefix?: (option: CreatorFilterOption) => ReactNode;
  }
) {
  const multiSelectOptionsMap = sources?.multiSelectOptionsMap;
  return useMemo(
    () =>
      (key: keyof CreatorFilterValues, close: () => void): ReactNode | null => {
        if (key === "country") {
          return (
            <CountryFilterContent
              value={filters.country ?? []}
              onChange={(next) => patchFilters({ country: next })}
              groups={sources?.countryGroups}
              counts={sources?.countryCounts}
              loading={sources?.countryLoading}
              countsLoading={sources?.countryCountsLoading}
            />
          );
        }
        if (key === "influencerCategory") {
          return (
            <VerticalCategoryFilterContent
              fieldKey="influencerCategory"
              value={filters.influencerCategory ?? []}
              onChange={(next) => patchFilters({ influencerCategory: next })}
              groups={sources?.categoryGroups}
              loading={sources?.categoryLoading}
            />
          );
        }
        if (key === "primaryVerticalCategories") {
          return (
            <VerticalCategoryFilterContent
              fieldKey="primaryVerticalCategories"
              value={filters.primaryVerticalCategories ?? []}
              onChange={(next) =>
                patchFilters({ primaryVerticalCategories: next })
              }
              groups={sources?.categoryGroups}
              loading={sources?.categoryLoading}
            />
          );
        }
        if (key === "taskIDs") {
          return (
            <CrawlerTaskFilterContent
              value={filters.taskIDs ?? []}
              onChange={(next) => patchFilters({ taskIDs: next })}
              options={sources?.taskOptions}
              loading={sources?.taskLoading}
              searching={sources?.taskSearching}
              onSearchChange={sources?.onTaskSearchChange}
            />
          );
        }
        if (key === "projectID") {
          return (
            <ProjectFilterContent
              value={filters.projectID ?? []}
              onChange={(next) => patchFilters({ projectID: next })}
              options={sources?.projectOptions}
              loading={sources?.projectLoading}
              searching={sources?.projectSearching}
              onSearchChange={sources?.onProjectSearchChange}
            />
          );
        }
        const type = FIELD_TYPE_MAP.get(key);

        if (type === "number-range") {
          const isQuantity = key === "quantity" || key === "flow";
          return (
            <div className="p-2">
              <NumberRangeEditor
                value={filters[key] as NumberRange | undefined}
                options={isQuantity ? QUANTITY_RANGE_OPTIONS : []}
                unit={isQuantity ? "K" : ""}
                onChange={(next) =>
                  patchFilters({ [key]: next } as Partial<CreatorFilterValues>)
                }
                onApplied={close}
              />
            </div>
          );
        }

        if (type === "number-preset") {
          const range = filters[key] as NumberRange | undefined;
          const config =
            FIELD_CONFIG_MAP.get(key)?.presetConfig ?? DEFAULT_PRESET_CONFIG;
          return (
            <div className="p-2">
              <NumberPresetEditor
                value={range?.min}
                options={config.options}
                onChange={(next) =>
                  patchFilters({
                    [key]: next == null ? undefined : { min: next },
                  } as Partial<CreatorFilterValues>)
                }
                onApplied={close}
                prefix={config.prefix}
                suffix={config.suffix}
                inputPlaceholder={config.inputPlaceholder}
              />
            </div>
          );
        }

        if (type === "tri-state") {
          const config = FIELD_CONFIG_MAP.get(key);
          return (
            <TriStateContent
              value={filters[key] as boolean | undefined}
              onChange={(next) => {
                patchFilters({ [key]: next } as Partial<CreatorFilterValues>);
                close();
              }}
              labels={config?.triStateLabels ?? { true: "是", false: "否" }}
            />
          );
        }

        if (type === "single-select") {
          return (
            <SingleSelectContent
              options={GENDER_OPTIONS}
              value={filters[key] as string | undefined}
              onChange={(next) => {
                patchFilters({ [key]: next } as Partial<CreatorFilterValues>);
                close();
              }}
            />
          );
        }

        if (type === "text") {
          const config = FIELD_CONFIG_MAP.get(key);
          return (
            <div className="p-2">
              <TextFilterEditor
                value={filters[key] as string | undefined}
                placeholder={config?.placeholder}
                normalizeText={config?.normalizeText}
                onChange={(next) =>
                  patchFilters({ [key]: next } as Partial<CreatorFilterValues>)
                }
                onApplied={close}
              />
            </div>
          );
        }

        if (type === "tag-input") {
          return (
            <div className="p-2">
              <TagFilterEditor
                value={filters[key] as string[] | undefined}
                placeholder={FIELD_CONFIG_MAP.get(key)?.placeholder}
                onChange={(next) =>
                  patchFilters({ [key]: next } as Partial<CreatorFilterValues>)
                }
                onApplied={close}
              />
            </div>
          );
        }

        const multiOptions = multiSelectOptionsMap?.[key];
        if (multiOptions) {
          return (
            <MultiSelectContent
              options={multiOptions.options}
              selectedValues={(filters[key] as string[] | undefined) ?? []}
              onChange={(next) =>
                patchFilters({ [key]: next } as Partial<CreatorFilterValues>)
              }
              loading={multiOptions.isLoading}
              searchPlaceholder={multiOptions.placeholder}
              renderOptionPrefix={
                key === "channelType"
                  ? sources?.renderChannelOptionPrefix
                  : undefined
              }
              showEmpty={key === "language"}
            />
          );
        }

        return null;
      },
    [filters, patchFilters, multiSelectOptionsMap, sources]
  );
}

export { AVG_VIEW_PRESETS };
