import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Apply business_unit filter to a Supabase query.
 * Pass null for master users (sees all data).
 * Uses case-insensitive matching so "Shipyard"/"shipyard" both match.
 */
export function applyBusinessUnitFilter(
  query: any,
  businessUnit: string | null,
): any {
  if (businessUnit === null) return query;
  return query.ilike("business_unit", businessUnit);
}
