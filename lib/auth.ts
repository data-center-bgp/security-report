import { createBrowserClient } from "./supabase";

export interface UserProfile {
  id: string;
  full_name: string;
  business_unit: string;
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, business_unit")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export function isMasterUser(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.business_unit.toLowerCase() === "master";
}

/** Returns null if master (no filter), or the business_unit string for site users */
export function getBusinessUnitFilter(
  profile: UserProfile | null,
): string | null {
  if (!profile) return null;
  if (isMasterUser(profile)) return null;
  return profile.business_unit;
}
