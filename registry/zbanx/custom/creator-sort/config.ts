import type { CreatorSortField } from "@/registry/zbanx/custom/creator-filter-core/types";

export interface CreatorSortOption {
  field: CreatorSortField;
  label: string;
}

// 后端排序字段展示子集：价格后端不支持，排名类与命中标签暂不展示
export const CREATOR_SORT_OPTIONS: CreatorSortOption[] = [
  { field: "quantity", label: "渠道量级" },
  { field: "avg_view", label: "均观看量" },
  { field: "avg_view_rate", label: "均观看指数" },
  { field: "avg_like_view_rate", label: "均点赞观看指数" },
  { field: "avg_engagement_rate", label: "均互动指数" },
  { field: "last_published_at", label: "上次发帖" },
  { field: "avg_like", label: "均点赞" },
  { field: "avg_comment", label: "均评论" },
];
