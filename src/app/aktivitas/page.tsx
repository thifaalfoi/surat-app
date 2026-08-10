"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { formatDateTime } from "@/lib/format";

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

export default function AktivitasPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity?limit=100")
      .then((r) => r.json())
      .then((d) => setActivities(d.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-(--navy)">Riwayat Aktivitas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Catatan seluruh aktivitas pengguna dalam sistem</p>
      </div>

      <div className="bg-white rounded-xl border border-(--border) divide-y divide-(--border)">
        {loading && <p className="text-sm text-slate-400 p-6 text-center">Memuat...</p>}
        {!loading && activities.length === 0 && (
          <p className="text-sm text-slate-400 p-6 text-center">Belum ada aktivitas tercatat</p>
        )}
        {activities.map((a) => (
          <div key={a.id} className="flex gap-3 p-4">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-sm">
              {ACTION_ICON[a.action] ?? "•"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">{a.detail}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {a.user_name} · {formatDateTime(a.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
