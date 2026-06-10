/**
 * Central list of operational sites (business units), excluding "master".
 * Add a new site here and it will appear in all site selectors, badges,
 * and the dashboard per-site breakdown table.
 *
 * `value` must match the lowercase `business_unit` value stored in Supabase.
 */
export interface SiteConfig {
  value: string;
  label: string;
  badgeClass: string;
}

export const SITES: SiteConfig[] = [
  {
    value: "shipyard",
    label: "Shipyard",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "shorebase",
    label: "Shorebase",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
  },
  {
    value: "tst",
    label: "TST",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
];

export const MASTER_BADGE_CLASS =
  "bg-purple-100 text-purple-800 border-purple-200";
