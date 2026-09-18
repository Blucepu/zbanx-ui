import type { ReactNode } from "react";

/** 单页抓取函数：filters 由调用方受控传入，返回追加式页面 */
export type QueryListFetchFn<TItem, TFilters> = (params: {
  filters: TFilters;
  page: number;
  size: number;
}) => Promise<{ items: TItem[]; total: number }>;

/**
 * 列表命令式句柄（非受控读取）。
 * 通过 useQueryListRef() 创建后经 listRef 传入，父组件可直接调用。
 */
export interface QueryListRef<TItem> {
  /** 重新加载：默认重验已加载页；toFirstPage 则丢弃已加载页回到第一页 */
  reload: (options?: { toFirstPage?: boolean }) => void;
  /** 清空数据并暂停拉取，直到 filters 变化或 reload */
  clear: () => void;
  /** 获取选中 id（非受控读取，批量操作入口） */
  getSelectedIds: () => string[];
  /** 获取选中行数据 */
  getSelectedRows: () => TItem[];
  /** 清空选中 */
  clearSelection: () => void;
}

/** 底部栏右侧扩展信息（分页信息等） */
export interface QueryListFooterInfo {
  /** 已加载页数 */
  pageCount: number;
  /** 已加载条数 */
  loadedCount: number;
  /** 服务端总数 */
  total: number;
  /** 当前是否有查询错误 */
  isError: boolean;
  /** 重试 */
  retry: () => void;
}

/** 底部栏右侧扩展：静态节点或接收分页信息的渲染函数 */
export type QueryListFooterExtra =
  | ReactNode
  | ((info: QueryListFooterInfo) => ReactNode);

export interface QueryListProps<TItem, TFilters> {
  /** 单页抓取函数（调用方注入，组件内执行） */
  fetchPage: QueryListFetchFn<TItem, TFilters>;
  /** 受控筛选值（抽屉/chips 等域 UI 在外，筛选归调用方所有） */
  filters: TFilters;
  /** TanStack queryKey（调用方计算，如需忽略快照等展示态由调用方处理） */
  queryKey: unknown[];
  /** 行 key 提取 */
  rowKey: (row: TItem) => string;
  /** 行渲染（行内选中态经 useRowSelection 自取，无需传参） */
  renderItem: (row: TItem, index: number) => ReactNode;
  /** 加载骨架（初筛与翻页共用，内部 UI 态经 useQueryListUI 自取） */
  renderSkeleton?: () => ReactNode;
  /** 空数据渲染 */
  renderEmpty?: () => ReactNode;
  /** 错误渲染（带重试回调） */
  renderError?: (error: Error, retry: () => void) => ReactNode;
  /** 底部栏右侧扩展（分页信息等） */
  footerExtra?: QueryListFooterExtra;
  /** 全部加载完成后的尾部提示 */
  listEndText?: ReactNode;
  /** 每页条数 */
  pageSize?: number;
  /** 是否开启行多选 */
  selectable?: boolean;
  /** 命令式句柄 */
  listRef?: QueryListRef<TItem>;
  /** 选中变化通知（仅通知，不接管状态） */
  onSelectionChange?: (ids: string[]) => void;
  /** 服务端总数变化通知（供外部标题等展示） */
  onTotalChange?: (total: number) => void;
  /** 查询失败通知（诊断日志等，组件内不消费） */
  onError?: (error: unknown) => void;
  /** 加载态变化通知（拉取中，或尚无数据且未清空的待加载态） */
  onLoadingChange?: (loading: boolean) => void;
  /** 查询总开关（如筛选恢复完成前禁用） */
  enabled?: boolean;
  /** 虚拟列表行高预估（透传 Virtuoso defaultItemHeight，不传则自动测量） */
  estimatedItemHeight?: number;
  className?: string;
}
