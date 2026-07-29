"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  UserMinus,
  PackageCheck,
  PackageX,
  MailOpen,
  Send,
  AlertTriangle,
  Droplets,
  Fuel,
  Zap,
  Anchor,
  Database,
  UserCog,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Kontrol Akses",
    items: [
      { href: "/orang/masuk", label: "Orang Masuk", icon: Users },
      { href: "/orang/keluar", label: "Orang Keluar", icon: UserMinus },
      { href: "/barang/masuk", label: "DO Masuk (Barang)", icon: PackageCheck },
      { href: "/barang/keluar", label: "DO Keluar (Barang)", icon: PackageX },
      { href: "/surat/masuk", label: "Surat Masuk", icon: MailOpen },
      { href: "/surat/keluar", label: "Surat Keluar", icon: Send },
    ],
  },
  {
    label: "Laporan Kejadian",
    items: [{ href: "/kejadian", label: "Form Kejadian", icon: AlertTriangle }],
  },
  {
    label: "Laporan Operasional",
    items: [
      { href: "/laporan/bunker", label: "Bunker Fresh Water", icon: Droplets },
      { href: "/laporan/fuel", label: "Mobil Tangki Fuel", icon: Fuel },
      { href: "/laporan/travo-blower", label: "Travo Blower", icon: Zap },
      { href: "/laporan/tambat", label: "Tambat", icon: Anchor },
    ],
  },
];

// business_unit yang boleh melihat menu Master Data
const MASTER_ALLOWED_UNITS = ["master", "tst", "shipyard", "shorebase"];

const masterGroup = {
  label: "Master Data",
  items: [
    { href: "/master/travo-blower", label: "Travo / Blower", icon: Database },
    { href: "/master/security", label: "Nama Security", icon: UserCog },
  ],
};

interface SidebarContentProps {
  collapsed?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

function SidebarContent({
  collapsed = false,
  onClose,
  onToggle,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const supabase = createBrowserClient();

  // Hindari hydration mismatch: tema baru diketahui setelah mount di klien.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  const canAccessMaster = MASTER_ALLOWED_UNITS.includes(
    (profile?.business_unit ?? "").toLowerCase(),
  );
  const groups = canAccessMaster ? [...navGroups, masterGroup] : navGroups;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div
        className={cn(
          "flex items-center border-b h-16 shrink-0",
          collapsed ? "justify-center px-2" : "px-4 gap-2",
        )}
      >
        <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg text-foreground truncate flex-1">
            Security Monitor
          </span>
        )}
        {/* Desktop toggle */}
        {onToggle && (
          <button
            onClick={onToggle}
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
        {/* Mobile close */}
        {onClose && (
          <button
            className="ml-auto p-1.5 rounded-md hover:bg-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.label && collapsed && (
              <div className="my-1 border-t border-border/50" />
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-md text-sm font-medium transition-colors",
                      collapsed
                        ? "justify-center px-2 py-2"
                        : "gap-3 px-3 py-2",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-2 py-3 space-y-2">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.full_name ?? "User"}
              </p>
              <BusinessUnitBadge value={profile?.business_unit} />
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center"
            title={profile?.full_name ?? "User"}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? "Mode Terang" : "Mode Gelap"}
          className={cn(
            "w-full flex items-center rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors py-2",
            collapsed ? "justify-center px-2" : "gap-2 px-3",
          )}
        >
          {isDark ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && (isDark ? "Mode Terang" : "Mode Gelap")}
        </button>
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors py-2",
            collapsed ? "justify-center px-2" : "gap-2 px-3",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r bg-background h-screen sticky top-0 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </aside>

      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-background border shadow-sm"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r shadow-xl z-50">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
