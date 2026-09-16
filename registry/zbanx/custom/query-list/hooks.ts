"use client";

import { useCallback, useContext, useRef, useSyncExternalStore } from "react";
import { QueryListContext } from "./context";
import type { QueryListRef } from "./types";

/** 创建稳定的命令式句柄对象（noop 默认，方法在 render 体赋值） */
export function useQueryListRef<TItem>(): QueryListRef<TItem> {
  return useRef<QueryListRef<TItem>>({
    reload: () => {},
    clear: () => {},
    getSelectedIds: () => [],
    getSelectedRows: () => [],
    clearSelection: () => {},
  }).current;
}

function useQueryListContextValue() {
  const context = useContext(QueryListContext);
  if (!context) throw new Error("必须在 QueryList 内使用");
  return context;
}

/** 读取列表内部存储（同包内底部栏等使用） */
export function useQueryListStore() {
  return useQueryListContextValue().store;
}

/** 行级选中订阅：快照为单个 boolean，仅本行变化才重渲染 */
export function useRowSelection(id: string): {
  selected: boolean;
  toggle: (next: boolean) => void;
} {
  const store = useQueryListStore();
  const getSnapshot = useCallback(() => store.has(id), [store, id]);
  const selected = useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot
  );
  const toggle = useCallback(
    (next: boolean) => store.toggle(id, next),
    [store, id]
  );
  return { selected, toggle };
}

/** 行样式开关订阅（骨架与行同源，如 selectable 让位与占位） */
export function useQueryListUI(): { selectable: boolean } {
  const context = useContext(QueryListContext);
  if (!context) throw new Error("必须在 QueryList 内使用");
  return { selectable: context.selectable };
}
