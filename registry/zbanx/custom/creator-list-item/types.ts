export interface CreatorVideoLite {
  id: string;
  title?: string | null;
  url?: string | null;
  coverUrl?: string | null;
  publishedAt?: string | null;
  totalView?: number | null;
}

/** 询价记录（精简结构，与后端 creator.inquiries 同形） */
export interface CreatorPriceInquiry {
  id: string;
  cooperationMode?: string | null;
  cooperationModes?: string[] | null;
  inquiryMin?: number | null;
  inquiryMax?: number | null;
  createdAt?: string | null;
}

export interface CreatorChannelLite {
  id: string;
  channelName?: string | null;
  channelURL?: string | null;
  channelType?: string | null;
  avatarUrl?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  handle?: string | null;
  /** 达人 ID（详情外链构造用） */
  creatorId?: string | null;
  official?: boolean | null;
  unavailable?: boolean;
  highFrequency?: boolean;
  fans?: number | null;
  totalViews?: number | null;
  avgViews?: number | null;
  engagementRate?: number | null;
  /** 抓取更新时间（更新于文案回退值） */
  crawlerUpdatedAt?: string | null;
  /** 周期内视频数（用于新鲜度判断） */
  videoCount?: number | null;
  /** 最新发布视频时间（用于新鲜度判断） */
  lastPublishedAt?: string | null;
  /** 历史 CPM */
  cpm?: number | null;
  /** flink 侧抓取更新时间（用于新鲜度判断） */
  flinkCrawlerUpdatedAt?: string | null;
  /** flink 侧基础更新时间（用于新鲜度判断） */
  flinkBaseUpdatedAt?: string | null;
  /** 询价记录（合作方式价格展示用） */
  inquiries?: CreatorPriceInquiry[];
  description?: string | null;
  primaryCategories?: string[];
  verticalCategories?: string[];
  contentTypes?: string[];
  cooperationModes?: string[];
  videos?: CreatorVideoLite[];
}
