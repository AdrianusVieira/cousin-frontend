import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { LastUpdatedResponse, MetaEntity } from "@/types/api";

/**
 * `max(updated_at)` per entity, from one shared endpoint — every page reads the same
 * cache entry, so the stamp costs a single request no matter how many headers show it.
 * Mutations that change an entity should invalidate this key so the stamp moves with them.
 */
export const LAST_UPDATED_QUERY_KEY = ["meta", "last-updated"];

export function useLastUpdated(entity?: MetaEntity) {
  const { data } = useQuery({
    enabled: entity !== undefined,
    queryFn: () => api.get<LastUpdatedResponse>("/meta/last-updated"),
    queryKey: LAST_UPDATED_QUERY_KEY,
  });

  return { lastUpdatedAt: entity ? (data?.[entity] ?? null) : null };
}
