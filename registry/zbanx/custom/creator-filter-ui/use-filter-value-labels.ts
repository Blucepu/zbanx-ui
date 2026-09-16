"use client";

import type { CreatorFilterOption } from "@/registry/zbanx/custom/creator-filter-core/types";
import { useRegisterFieldOptionLabels } from "@/registry/zbanx/custom/creator-filter-core/where";
import { GENDER_OPTIONS } from "./creator-filter-field";

export interface FilterValueLabelSources {
  countryOptions?: CreatorFilterOption[];
  taskOptions?: CreatorFilterOption[];
  projectOptions?: CreatorFilterOption[];
  categoryOptions?: CreatorFilterOption[];
}

/** 预注册各字段选项标签，供 Chip 回显离屏值。调用方传入已加载的选项即可，无任何请求。 */
export function useFilterValueLabels(sources?: FilterValueLabelSources): void {
  useRegisterFieldOptionLabels("country", sources?.countryOptions ?? []);
  useRegisterFieldOptionLabels("taskIDs", sources?.taskOptions ?? []);
  useRegisterFieldOptionLabels("projectID", sources?.projectOptions ?? []);
  useRegisterFieldOptionLabels(
    "influencerCategory",
    sources?.categoryOptions ?? []
  );
  useRegisterFieldOptionLabels(
    "primaryVerticalCategories",
    sources?.categoryOptions ?? []
  );
  useRegisterFieldOptionLabels("gender", GENDER_OPTIONS);
}
