"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { formatDateTime } from "@/lib/format";

type Stats = {
  totalMasuk: number;
  totalKeluar: number;
  diproses: number;
  selesai: number;
  perBulan: { bulan: string; jenis: string; count: number }[];
};

type Activity = {
  id: string;
  action: string;
  detail: string;
  created_at: string;
  user_name: string;
};

const ACTION_ICON: Record<string, string> = {
  LOGIN: "🔑",
  LOGOUT: "🚪",
  CREATE_SURAT: "📄",
  UPDATE_SURAT: "✏️",
  DELETE_SURAT: "🗑️",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats);
    fetch("/api/activity?limit=8")
      .then((r) => r.json())
      .then((d) => setActivities(d.data));
  }, []);

  const cards = [
    { label: "Surat Masuk", value: stats?.totalMasuk, color: "bg-blue-50 text-blue-700 ring-blue-200", icon: "↓" },
    { label: "Surat Keluar", value: stats?.totalKeluar, color: "bg-orange-50 text-orange-700 ring-orange-200", icon: "↑" },
    { label: "Diproses", value: stats?.diproses, color: "bg-amber-50 text-amber-700 ring-amber-200", icon: "⏳" },
    { label: "Selesai", value: stats?.selesai, color: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "✓" },
  ];

  const maxBulanCount = Math.max(1, ...(stats?.perBulan.map((b) => b.count) ?? [1]));
  const bulanMap = new Map<string, { masuk: number; keluar: number }>();
  stats?.perBulan.forEach((b) => {
    const entry = bulanMap.get(b.bulan) || { masuk: 0, keluar: 0 };
    if (b.jenis === "MASUK") entry.masuk = b.count;
    else entry.keluar = b.count;
    bulanMap.set(b.bulan, entry);
  });

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-(--navy)">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ringkasan statistik surat instansi</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 ring-1 ${c.color}`}>
            <div className="text-2xl">{c.icon}</div>
            <div className="text-2xl font-bold mt-2">{c.value ?? "—"}</div>
            <div className="text-xs font-medium mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl border border-(--border) p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Statistik 6 Bulan Terakhir</h2>
          {bulanMap.size === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Belum ada data surat</p>
          ) : (
            <div className="space-y-3">
              {Array.from(bulanMap.entries()).map(([bulan, v]) => (
                <div key={bulan} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-slate-500 shrink-0">{bulan}</div>
                  <div className="flex-1 flex gap-1 h-5">
                    <div
                      className="bg-blue-500 rounded-sm"
                      style={{ width: `${(v.masuk / maxBulanCount) * 100}%`, minWidth: v.masuk ? 6 : 0 }}
                      title={`Masuk: ${v.masuk}`}
                    />
                    <div
                      className="bg-orange-400 rounded-sm"
                      style={{ width: `${(v.keluar / maxBulanCount) * 100}%`, minWidth: v.keluar ? 6 : 0 }}
                      title={`Keluar: ${v.keluar}`}
                    />
                  </div>
                  <div className="w-12 text-xs text-slate-500 text-right shrink-0">{v.masuk + v.keluar}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4 mt-4 pt-4 border-t border-(--border) text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Masuk</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" /> Keluar</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-(--border) p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Aktivitas Terbaru</h2>
            <Link href="/aktivitas" className="text-xs text-(--accent) font-medium hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="space-y-4">
            {activities.length === 0 && <p className="text-sm text-slate-400">Belum ada aktivitas</p>}
            {activities.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                  {ACTION_ICON[a.action] ?? "•"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{a.detail}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
