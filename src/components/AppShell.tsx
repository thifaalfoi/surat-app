"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Me = { name: string; username: string; role: string } | null;

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match?: string;
  jenis?: string;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/surat?jenis=MASUK", label: "Surat Masuk", icon: "↓", match: "/surat", jenis: "MASUK" },
  { href: "/surat?jenis=KELUAR", label: "Surat Keluar", icon: "↑", match: "/surat", jenis: "KELUAR" },
  { href: "/aktivitas", label: "Riwayat Aktivitas", icon: "🕘" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<Me>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d?.user ?? null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(item: NavItem) {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    if (item.match) {
      return pathname.startsWith(item.match) && searchParams.get("jenis") === item.jenis;
    }
    return pathname === item.href;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-(--navy) text-white">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="text-lg font-semibold tracking-tight">SIMAP</div>
          <div className="text-xs text-white/50 mt-0.5">Sistem Manajemen Arsip & Persuratan</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active ? "bg-(--accent) text-white font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <Link
            href="/surat/baru"
            className="flex items-center justify-center gap-2 rounded-lg bg-white text-(--navy) px-3 py-2.5 text-sm font-semibold hover:bg-white/90 transition"
          >
            + Surat Baru
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-(--border) bg-white px-4 md:px-8 py-3">
          <div className="md:hidden font-semibold text-(--navy)">SIMSurat</div>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100 transition"
            >
              <span className="h-8 w-8 rounded-full bg-(--accent) text-white flex items-center justify-center text-sm font-semibold">
                {me?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
              <span className="text-sm text-slate-700 hidden sm:inline">{me?.name ?? "..."}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-(--border) bg-white shadow-lg py-1 z-20">
                <div className="px-3 py-2 border-b border-(--border)">
                  <div className="text-sm font-medium text-slate-800">{me?.name}</div>
                  <div className="text-xs text-slate-500">{me?.role === "ADMIN" ? "Admin" : "Petugas"}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-(--danger) hover:bg-slate-50"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto gap-1 border-b border-(--border) bg-white px-3 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 md:px-8 py-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}