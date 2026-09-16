"use client";

import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";
import type {
  CreatorFilterFieldConfig,
  CreatorFilterOption,
  CreatorFilterValues,
} from "@/registry/zbanx/custom/creator-filter-core/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/zbanx/ui/tooltip";
import CreatorFilterField, {
  type FieldOptionSources,
} from "./creator-filter-field";

interface CreatorFilterSectionProps {
  title: string;
  fields: CreatorFilterFieldConfig[];
  values: CreatorFilterValues;
  onChange: <K extends keyof CreatorFilterValues>(
    key: K,
    value: CreatorFilterValues[K]
  ) => void;
  optionsByField: Record<
    string,
    { options: CreatorFilterOption[]; isLoading: boolean }
  >;
  sources?: FieldOptionSources;
  renderChannelOptionPrefix?: (option: CreatorFilterOption) => ReactNode;
  renderChannelItemIcon?: (value: string) => ReactNode;
}

export function CreatorFilterSection({
  title,
  fields,
  values,
  onChange,
  optionsByField,
  sources,
  renderChannelOptionPrefix,
  renderChannelItemIcon,
}: CreatorFilterSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((field) => (
          <div key={`${title}-${field.key}`} className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-slate-500 text-xs">
              {field.label}
              {field.unsupported && (
                <span className="text-orange-500">（暂不支持）</span>
              )}
              {field.tip && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <CircleHelp
                        className="size-3.5 cursor-help text-muted-foreground"
                        aria-hidden="true"
                      />
                    }
                  />
                  <TooltipContent className="max-w-60">
                    {field.tip}
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
            <CreatorFilterField
              field={field}
              values={values}
              onChange={onChange}
              options={optionsByField[field.key]?.options}
              optionsLoading={optionsByField[field.key]?.isLoading}
              sources={sources}
              renderChannelOptionPrefix={renderChannelOptionPrefix}
              renderChannelItemIcon={renderChannelItemIcon}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
