export interface CreatorVideoLite {
  id: string;
  title?: string | null;
  url?: string | null;
  coverUrl?: string | null;
  publishedAt?: string | null;
  totalView?: number | null;
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
  official?: boolean | null;
  unavailable?: boolean;
  highFrequency?: boolean;
  fans?: number | null;
  totalViews?: number | null;
  avgViews?: number | null;
  engagementRate?: number | null;
  description?: string | null;
  primaryCategories?: string[];
  verticalCategories?: string[];
  contentTypes?: string[];
  cooperationModes?: string[];
  videos?: CreatorVideoLite[];
}
