"use client";

import { createContext } from "react";
import type { SelectionStore } from "./selection-store";

export interface QueryListContextValue {
  store: SelectionStore;
  selectable: boolean;
}

/** 列表内部上下文：选中存储与行样式开关单源，行与骨架同源消费，杜绝两者漂移 */
export const QueryListContext = createContext<QueryListContextValue | null>(
  null
);
