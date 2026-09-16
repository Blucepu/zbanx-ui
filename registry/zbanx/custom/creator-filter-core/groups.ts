import type { CreatorFilterGroupConfig } from "./types";

const normalizeNumericId = (raw: string): string => raw.replace(/\D/g, "");

export const CREATOR_FILTER_GROUPS: CreatorFilterGroupConfig[] = [
  {
    key: "common",
    title: "常用",
    fields: [
      {
        key: "country",
        label: "国家",
        type: "multi-select",
        placeholder: "请选择国家/地区",
        pin: true,
      },
      {
        key: "primaryVerticalCategories",
        label: "主行业",
        type: "multi-select",
        placeholder: "请选择行业类目",
        tip: "AI分析的红人属于哪个类目的标签",
        pin: true,
      },
      {
        key: "influencerCategory",
        label: "商业垂类",
        type: "multi-select",
        placeholder: "请选择行业类目",
        tip: "AI分析的红人属于哪个类目的标签",
        pin: true,
      },
      {
        key: "quantity",
        label: "渠道量级/流量",
        type: "number-range",
        pin: true,
      },
      {
        key: "avgView",
        label: "均观看",
        type: "number-preset",
        pin: true,
        tip: "时间区间内（YouTube 3个月，TikTok和Instagram 1个月）视频的平均观看量",
        presetConfig: {
          options: [
            { value: 1_000, label: "1K+" },
            { value: 10_000, label: "10K+" },
            { value: 100_000, label: "100K+" },
            { value: 1_000_000, label: "1M+" },
          ],
          prefix: "均观看",
          suffix: "以上",
          inputPlaceholder: "最小均观看",
        },
      },
      {
        key: "channelType",
        label: "渠道类型",
        type: "multi-select",
        placeholder: "请选择平台",
        pin: true,
      },
    ],
  },
  {
    key: "basic",
    title: "基础信息",
    fields: [
      {
        key: "creatorID",
        label: "用户ID",
        type: "text",
        placeholder: "请输入用户ID",
        normalizeText: normalizeNumericId,
      },
      {
        key: "channels",
        label: "渠道ID",
        type: "text",
        placeholder: "请输入渠道ID",
        normalizeText: normalizeNumericId,
      },
      {
        key: "channelUrl",
        label: "渠道链接",
        type: "text",
        placeholder: "请输入渠道链接",
      },
      { key: "email", label: "邮箱", type: "text", placeholder: "请输入邮箱" },
      {
        key: "channelName",
        label: "渠道名",
        type: "text",
        placeholder: "请输入渠道名称",
      },
      {
        key: "language",
        label: "语言",
        type: "multi-select",
        placeholder: "请选择语言",
      },
      {
        key: "gender",
        label: "性别",
        type: "single-select",
        placeholder: "请选择",
      },
    ],
  },
  {
    key: "content",
    title: "内容标签",
    fields: [
      {
        key: "contentTypes",
        label: "内容方向",
        type: "multi-select",
        placeholder: "请选择内容方向",
        tip: "AI分析的红人发布内容的模式",
      },
      {
        key: "tagKeyword",
        label: "标签关键字",
        type: "tag-input",
        placeholder: "请输入行业标签",
        tip: "所有爬虫标签和人工标签的关键字搜索，多个以换行、逗号、分号或冒号分隔（所有分隔符都不区分中英文）",
      },
      {
        key: "productLines",
        label: "产品线/品牌/型号",
        type: "multi-select",
        placeholder: "请选择",
        tip: "视频命中标签库配置好的产品线/品牌/型号标签",
      },
    ],
  },
  {
    key: "cooperation",
    title: "合作记录",
    fields: [
      {
        key: "projectID",
        label: "合作项目",
        type: "multi-select",
        placeholder: "请选择合作项目",
        tip: "通过项目合作的红人",
      },
      {
        key: "cooperationModes",
        label: "合作方式",
        type: "multi-select",
        placeholder: "请选择",
        tip: "使用现在合作方式有报价的数据",
      },
      {
        key: "eCommerceWebsites",
        label: "合作电商",
        type: "multi-select",
        placeholder: "请选择电商平台",
        tip: "两年内视频反链指向的网站",
      },
    ],
  },
  {
    key: "status",
    title: "渠道状态",
    fields: [
      {
        key: "inBlackList",
        label: "黑名单",
        type: "tri-state",
        triStateLabels: { true: "是", false: "否" },
      },
      {
        key: "isNew",
        label: "资源新旧",
        type: "tri-state",
        triStateLabels: { true: "新资源", false: "老资源" },
        tip: "新资源为未上线审核成功过的资源，旧资源为上线审核成功过的资源",
      },
      {
        key: "hasContact",
        label: "是否有联系方式",
        type: "tri-state",
        triStateLabels: { true: "是", false: "否" },
      },
      {
        key: "isTiktokGo",
        label: "TT GO",
        type: "tri-state",
        triStateLabels: { true: "只看", false: "排除" },
      },
      {
        key: "taskIDs",
        label: "爬虫任务",
        type: "multi-select",
        placeholder: "请选择爬虫任务",
      },
      {
        key: "official",
        label: "是否官方渠道",
        type: "tri-state",
        triStateLabels: { true: "是", false: "否" },
      },
    ],
  },
  {
    key: "performance",
    title: "数据表现",
    fields: [
      {
        key: "medianView",
        label: "中位数观看",
        type: "number-range",
        tip: "时间区间内（YouTube 3个月，TikTok和Instagram 1个月）视频观看从低到高中间的值",
      },
      {
        key: "avgViewRate",
        label: "均观看指数",
        type: "number-range",
        tip: "均观看量/粉丝数",
      },
      {
        key: "avgDuration",
        label: "均时长",
        type: "number-range",
        tip: "时间区间内（YouTube 3个月，TikTok和Instagram 1个月）视频的平均时长",
      },
      {
        key: "avgLike",
        label: "均点赞",
        type: "number-range",
        tip: "时间区间内（YouTube 3个月，TikTok和Instagram 1个月）视频的平均点赞数",
      },
      {
        key: "avgComment",
        label: "均评论",
        type: "number-range",
        tip: "时间区间内（YouTube 3个月，TikTok和Instagram 1个月）视频的平均评论数",
      },
      {
        key: "avgShare",
        label: "均分享",
        type: "number-range",
        tip: "时间区间内（YouTube 3个月，TikTok和Instagram 1个月）视频的平均分享数",
      },
      {
        key: "avgLikeViewRate",
        label: "均点赞观看指数",
        type: "number-range",
        tip: "均点赞数/平均观看数",
      },
      {
        key: "avgEngagementRate",
        label: "均互动指数",
        type: "number-range",
        tip: "均点赞数+均评论数/均观看数",
      },
    ],
  },
];

export const CREATOR_FILTER_FIELD_LABELS: Record<string, string> = {};
export const CREATOR_FILTER_TRI_STATE_LABELS: Record<
  string,
  { true: string; false: string }
> = {};
for (const group of CREATOR_FILTER_GROUPS) {
  for (const field of group.fields) {
    if (!(field.key in CREATOR_FILTER_FIELD_LABELS))
      CREATOR_FILTER_FIELD_LABELS[field.key] = field.label;
    if (
      field.type === "tri-state" &&
      field.triStateLabels &&
      !(field.key in CREATOR_FILTER_TRI_STATE_LABELS)
    )
      CREATOR_FILTER_TRI_STATE_LABELS[field.key] = field.triStateLabels;
  }
}
