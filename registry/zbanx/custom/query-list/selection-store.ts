/**
 * 选中存储（框架无关纯逻辑，可跨项目复用）。
 * useSyncExternalStore 订阅，行级以单个 boolean 快照细粒度更新。
 */

export interface SelectionStore {
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
  has: (id: string) => boolean;
  getSelectedIds: () => string[];
  /** 切换单个选中态（next 缺省时取反） */
  toggle: (id: string, next?: boolean) => void;
  /** 并入一批 id（全选用） */
  selectAll: (ids: string[]) => void;
  /** 剔除一批 id（全不选用，保留批次之外的选中） */
  removeAll: (ids: string[]) => void;
  clear: () => void;
  /** 落在给定集合中的选中数（全选/半选派生用） */
  countIn: (ids: string[]) => number;
}

export function createSelectionStore(
  onChange?: (ids: string[]) => void
): SelectionStore {
  let selected = new Set<string>();
  let version = 0;
  const listeners = new Set<() => void>();

  const emit = () => {
    version += 1;
    for (const listener of [...listeners]) listener();
    onChange?.([...selected]);
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getVersion: () => version,
    has: (id: string) => selected.has(id),
    getSelectedIds: () => [...selected],
    toggle: (id: string, next = !selected.has(id)) => {
      if (next === selected.has(id)) return;
      const copy = new Set(selected);
      if (next) copy.add(id);
      else copy.delete(id);
      selected = copy;
      emit();
    },
    selectAll: (ids: string[]) => {
      const copy = new Set(selected);
      let changed = false;
      for (const id of ids) {
        if (!copy.has(id)) {
          copy.add(id);
          changed = true;
        }
      }
      if (!changed) return;
      selected = copy;
      emit();
    },
    removeAll: (ids: string[]) => {
      if (ids.length === 0) return;
      const doomed = new Set(ids);
      let changed = false;
      const copy = new Set<string>();
      for (const id of selected) {
        if (doomed.has(id)) changed = true;
        else copy.add(id);
      }
      if (!changed) return;
      selected = copy;
      emit();
    },
    clear: () => {
      if (selected.size === 0) return;
      selected = new Set();
      emit();
    },
    countIn: (ids: string[]) => {
      let count = 0;
      for (const id of ids) {
        if (selected.has(id)) count += 1;
      }
      return count;
    },
  };
}
