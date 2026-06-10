"use client";

import { useBusinessUnit } from "./useBusinessUnit";

export function useDataFilter(siteOverride?: string | null) {
  const { businessUnitFilter, isMaster, loading } = useBusinessUnit();

  // Master can override per-dashboard site selector
  const effectiveFilter =
    isMaster && siteOverride !== undefined ? siteOverride : businessUnitFilter;

  return { filter: effectiveFilter, isMaster, loading };
}
