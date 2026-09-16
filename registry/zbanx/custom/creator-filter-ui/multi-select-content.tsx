"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CreatorFilterOption } from "@/registry/zbanx/custom/creator-filter-core/types";
import { EMPTY_FILTER_VALUE_LABEL } from "@/registry/zbanx/custom/creator-filter-core/where";
import { Checkbox } from "@/registry/zbanx/ui/checkbox";
import { Input } from "@/registry/zbanx/ui/input";

export function MultiSelectContent({
  options,
  selectedValues,
  onChange,
  loading,
  searchPlaceholder,
  renderOptionPrefix,
  searchValue,
  onSearchChange,
  searching,
  showEmpty = false,
}: {
  options: CreatorFilterOption[];
  selectedValues: string[];
  onChange: (next: string[]) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  renderOptionPrefix?: (option: CreatorFilterOption) => ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searching?: boolean;
  showEmpty?: boolean;
}) {
  const [search, setSearch] = useState("");
  const controlled = onSearchChange !== undefined;
  const inputValue = controlled ? (searchValue ?? "") : search;
  const normalizedSearch = (
    controlled ? "" : search.trim()
  ).toLocaleLowerCase();
  const filtered = useMemo(
    () =>
      normalizedSearch
        ? options.filter((option) =>
            `${option.label} ${option.value}`
              .toLocaleLowerCase()
              .includes(normalizedSearch)
          )
        : options,
    [options, normalizedSearch]
  );

  return (
    <div className="flex max-h-[min(30rem,calc(100vh-8rem))] flex-col">
      <div className="relative shrink-0 border-b p-2">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(event) => {
            if (controlled) onSearchChange?.(event.target.value);
            else setSearch(event.target.value);
          }}
          placeholder={searchPlaceholder ?? "搜索"}
          className="h-8 pr-7 pl-8 focus-visible:border-ring focus-visible:ring-0"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              if (controlled) onSearchChange?.("");
              else setSearch("");
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="清空搜索"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {loading && (
          <div className="flex h-20 items-center justify-center gap-2 text-muted-foreground text-sm">
            <LoaderCircle className="size-4 animate-spin" />
            加载中...
          </div>
        )}
        {!loading && searching && (
          <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground text-xs">
            <LoaderCircle className="size-3.5 animate-spin" />
            搜索中...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="p-3 text-center text-muted-foreground text-sm">
            没有匹配项
          </p>
        )}
        {!loading && showEmpty && (
          <EmptyOptionRow
            checked={selectedValues.includes("")}
            onToggle={() =>
              onChange(
                selectedValues.includes("")
                  ? selectedValues.filter((v) => v !== "")
                  : [...selectedValues, ""]
              )
            }
          />
        )}
        {!loading &&
          filtered.map((option) => {
            const checked = selectedValues.includes(option.value);
            const toggle = () => {
              onChange(
                checked
                  ? selectedValues.filter((v) => v !== option.value)
                  : [...selectedValues, option.value]
              );
            };
            return (
              <div
                key={option.value}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                className={cn(
                  "flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                )}
                onClick={toggle}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggle();
                  }
                }}
              >
                <Checkbox
                  checked={checked}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none"
                />
                {renderOptionPrefix?.(option)}
                <span className="min-w-0 truncate">{option.label}</span>
                {option.count !== undefined && (
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {option.count}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function EmptyOptionRow({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      className={cn(
        "flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
      )}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <Checkbox
        checked={checked}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none"
      />
      <span className="min-w-0 truncate">{EMPTY_FILTER_VALUE_LABEL}</span>
    </div>
  );
}
