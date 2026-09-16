export type CreatorMetricTip = "avgViews" | "engagementRate" | "videoCount";
export type CreatorPlatform = "youtube" | "tiktok" | "instagram" | "blog";

export function normalizeCreatorPlatform(
  platform?: string | null
): CreatorPlatform {
  const value = (platform ?? "").toLowerCase();
  if (value.includes("youtube")) return "youtube";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("instagram")) return "instagram";
  return "blog";
}

const PLATFORM_PERIOD: Record<CreatorPlatform, string> = {
  youtube: "近 3 个月",
  tiktok: "近 1 个月",
  instagram: "近 1 个月",
  blog: "当前统计周期",
};

const METRIC_LABELS: Record<CreatorMetricTip, string> = {
  avgViews: "均观看",
  engagementRate: "互动率",
  videoCount: "视频数",
};

function getMetricFormula(metric: CreatorMetricTip): string {
  switch (metric) {
    case "avgViews":
      return "视频观看量 ÷ 视频数";
    case "engagementRate":
      return "视频点赞+评论 ÷ 视频观看量";
    case "videoCount":
      return "统计周期内发布的视频数";
  }
}

export function getCreatorMetricTip(
  metric: CreatorMetricTip,
  platform?: CreatorPlatform
): string {
  if (!platform) {
    if (metric === "avgViews") {
      return "YouTube 近 3 个月；TikTok、Instagram 近 1 个月：视频观看量 ÷ 视频数";
    }
    if (metric === "engagementRate") {
      return "YouTube 近 3 个月；TikTok、Instagram 近 1 个月：视频点赞+评论 ÷ 视频观看量";
    }
    return "YouTube 近 3 个月；TikTok、Instagram 近 1 个月：统计周期内发布的视频数";
  }
  return `${METRIC_LABELS[metric]}：${PLATFORM_PERIOD[platform]}，${getMetricFormula(metric)}`;
}
