"use client";

import { type ReactNode, useEffect, useState } from "react";
import { CREATOR_FILTER_GROUPS } from "@/registry/zbanx/custom/creator-filter-core/groups";
import type {
  CreatorFilterOption,
  CreatorFilterValues,
} from "@/registry/zbanx/custom/creator-filter-core/types";
import { Button } from "@/registry/zbanx/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/registry/zbanx/ui/sheet";
import type { FieldOptionSources } from "./creator-filter-field";
import { CreatorFilterSection } from "./creator-filter-section";

export interface CreatorFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: CreatorFilterValues;
  onApply: (values: CreatorFilterValues) => void;
  onReset?: () => void;
  /** 抽屉宽度（px），默认 520 */
  width?: number;
  optionsByField?: Record<
    string,
    { options: CreatorFilterOption[]; isLoading: boolean }
  >;
  sources?: FieldOptionSources;
  renderChannelOptionPrefix?: (option: CreatorFilterOption) => ReactNode;
  renderChannelItemIcon?: (value: string) => ReactNode;
}

export default function CreatorFilterDrawer({
  open,
  onOpenChange,
  values,
  onApply,
  onReset,
  width = 520,
  optionsByField = {},
  sources,
  renderChannelOptionPrefix,
  renderChannelItemIcon,
}: CreatorFilterDrawerProps) {
  const [draft, setDraft] = useState<CreatorFilterValues>(values);

  useEffect(() => {
    if (open) setDraft(values);
  }, [open, values]);

  const handleChange = <K extends keyof CreatorFilterValues>(
    key: K,
    value: CreatorFilterValues[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0"
        style={{ width, maxWidth: "92vw" }}
      >
        <SheetHeader className="shrink-0 border-b border-[#E2E8F0] px-6 py-5 text-left">
          <SheetTitle className="text-[16px] text-slate-950">
            筛选维度
          </SheetTitle>
          <SheetDescription>设置条件以精准定位目标达人。</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {CREATOR_FILTER_GROUPS.map((group) => (
            <CreatorFilterSection
              key={group.key}
              title={group.title}
              fields={group.fields}
              values={draft}
              onChange={handleChange}
              optionsByField={optionsByField}
              sources={sources}
              renderChannelOptionPrefix={renderChannelOptionPrefix}
              renderChannelItemIcon={renderChannelItemIcon}
            />
          ))}
        </div>
        <div className="flex h-16 shrink-0 items-center justify-end gap-3 border-t border-[#E2E8F0] px-6">
          <Button
            variant="outline"
            onClick={() => {
              setDraft({});
              onReset?.();
            }}
          >
            重置
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            应用筛选
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
