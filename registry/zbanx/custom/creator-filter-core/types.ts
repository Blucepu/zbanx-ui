export type TriState = boolean | undefined;

export interface NumberRange {
  min?: number;
  max?: number;
}

export interface CreatorFilterValues {
  /** 国家/地区：空字符串 '' 元素表示“空”（未填写国家的数据，后端按空值过滤） */
  country?: string[];
  primaryVerticalCategories?: string[];
  influencerCategory?: string[];
  quantity?: NumberRange;
  flow?: NumberRange;
  avgView?: NumberRange;
  channelType?: string[];

  creatorID?: string;
  channels?: string;
  channelUrl?: string;
  email?: string;
  channelName?: string;
  /** 语言：空字符串 '' 元素表示“空”（未填写语言的数据，后端按空值过滤） */
  language?: string[];
  gender?: string;

  contentTypes?: string[];
  tagKeyword?: string[];
  productLines?: string[];

  projectID?: string[];
  cooperationModes?: string[];
  eCommerceWebsites?: string[];

  inBlackList?: TriState;
  isNew?: TriState;
  hasContact?: TriState;
  isTiktokGo?: TriState;
  taskIDs?: string[];
  official?: TriState;

  medianView?: NumberRange;
  avgViewRate?: NumberRange;
  avgDuration?: NumberRange;
  avgLike?: NumberRange;
  avgComment?: NumberRange;
  avgShare?: NumberRange;
  avgLikeViewRate?: NumberRange;
  avgEngagementRate?: NumberRange;
}

export type FilterLabelSnapshot = Record<string, Record<string, string>>;

/** 后端排序字段（与 creatorChannelListV2 orderBy field 同值，纯展示层字面量） */
export type CreatorSortField =
  | "quantity"
  | "avg_view"
  | "avg_view_rate"
  | "avg_like_view_rate"
  | "avg_engagement_rate"
  | "last_published_at"
  | "avg_like"
  | "avg_comment";

/** 后端排序方向（与 creatorChannelListV2 orderBy direction 同值） */
export type SortDirection = "ASC" | "DESC";

export interface CreatorSortValue {
  field: CreatorSortField;
  direction: SortDirection;
}

export interface PersistedCreatorFilterValues extends CreatorFilterValues {
  __labels?: FilterLabelSnapshot;
  /** 排序（与筛选同 envelope 持久化，不计入筛选项计数，不进入 where） */
  sort?: CreatorSortValue | null;
  /** 列表头固定偏好（与筛选同 envelope 持久化，不计入筛选项计数，不进入 where/queryKey） */
  __pinned?: CreatorFilterFieldKey[];
}

export type CreatorFilterFieldKey = keyof CreatorFilterValues;

export type CreatorFilterFieldType =
  | "multi-select"
  | "text"
  | "tag-input"
  | "number-range"
  | "number-preset"
  | "tri-state"
  | "single-select";

export interface NumberPresetFieldConfig {
  options: { value: number; label?: string }[];
  prefix?: string;
  suffix?: string;
  inputPlaceholder?: string;
}

export interface CreatorFilterFieldConfig {
  key: CreatorFilterFieldKey;
  label: string;
  type: CreatorFilterFieldType;
  placeholder?: string;
  unsupported?: boolean;
  pin?: boolean;
  triStateLabels?: { true: string; false: string };
  presetConfig?: NumberPresetFieldConfig;
  tip?: string;
  /** 文本输入自动规范化（仅 text 类型）：失焦与应用时执行；返回空字符串视为清空 */
  normalizeText?: (raw: string) => string;
}

export interface CreatorFilterGroupConfig {
  key: string;
  title: string;
  fields: CreatorFilterFieldConfig[];
}

/** 下拉选项（调用方注入数据，库内不做任何请求） */
export interface CreatorFilterOption {
  value: string;
  label: string;
  count?: number;
}
