import { CREATOR_FILTER_GROUPS } from "./groups";
import type { CreatorFilterFieldKey } from "./types";

function getOrderedFieldKeys(): CreatorFilterFieldKey[] {
  return CREATOR_FILTER_GROUPS.flatMap((group) =>
    group.fields.map((field) => field.key)
  );
}

export function getDefaultPinnedKeys(): CreatorFilterFieldKey[] {
  return CREATOR_FILTER_GROUPS.flatMap((group) => group.fields)
    .filter((field) => field.pin)
    .map((field) => field.key);
}

export function resolvePinnedKeys(
  saved?: CreatorFilterFieldKey[]
): CreatorFilterFieldKey[] {
  const ordered = getOrderedFieldKeys();
  const valid = new Set(ordered);
  if (saved === undefined) return getDefaultPinnedKeys();
  const picked = new Set(saved.filter((key) => valid.has(key)));
  return ordered.filter((key) => picked.has(key));
}

export function togglePinnedKeys(
  pinnedKeys: readonly CreatorFilterFieldKey[],
  key: CreatorFilterFieldKey
): CreatorFilterFieldKey[] {
  const ordered = getOrderedFieldKeys();
  if (!ordered.includes(key)) return [...pinnedKeys];
  const next = new Set(pinnedKeys);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return ordered.filter((item) => next.has(item));
}
