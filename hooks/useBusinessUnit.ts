"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { getUserProfile, type UserProfile } from "@/lib/auth";

export function useBusinessUnit() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const p = await getUserProfile(user.id);
      setProfile(p);
      setLoading(false);
    }

    load();
  }, []);

  const isMaster = profile?.business_unit?.toLowerCase() === "master";
  const businessUnitFilter = isMaster ? null : (profile?.business_unit ?? null);

  return { profile, loading, isMaster, businessUnitFilter };
}
