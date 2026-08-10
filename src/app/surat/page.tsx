"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";

type SuratItem = {
  id: string;
  jenis: "MASUK" | "KELUAR";
  nomor_surat: string;
  tanggal_surat: string;
  pihak: string;
  perihal: string;
  status: "DIPROSES" | "SELESAI";
  file_name: string | null;
  created_by_name: string;
};

function SuratListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jenis = searchParams.get("jenis") === "KELUAR" ? "KELUAR" : "MASUK";

  const [items, setItems] = useState<SuratItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ jenis, page: String(page), pageSize: "10" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/surat?${params.toString()}`);
    const data = await res.json();
    setItems(data.data);
    setTotalPages(data.pagination.totalPages);
    setTotal(data.pagination.total);
    setLoading(false);
  }, [jenis, page, search, status]);

  useEffect(() => {
    setPage(1);
  }, [jenis, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus surat ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/surat/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) load();
    else alert("Gagal menghapus surat");
  }

  const label = jenis === "MASUK" ? "Surat Masuk" : "Surat Keluar";
  const pihakLabel = jenis === "MASUK" ? "Pengirim" : "Penerima";

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-(--navy)">{label}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} surat tercatat</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(jenis === "MASUK" ? "/surat?jenis=KELUAR" : "/surat?jenis=MASUK")}
            className="rounded-lg border border-(--border) bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Lihat {jenis === "MASUK" ? "Surat Keluar" : "Surat Masuk"}
          </button>
          <Link
            href="/surat/baru"
            className="rounded-lg bg-(--accent) text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            + Tambah Surat
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari nomor surat, pihak, atau perihal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] rounded-lg border border-(--border) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-(--border) px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-(--accent)"
        >
          <option value="">Semua Status</option>
          <option value="DIPROSES">Diproses</option>
          <option value="SELESAI">Selesai</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-(--border) overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">No. Surat</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">{pihakLabel}</th>
                <th className="px-4 py-3 font-medium">Perihal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada surat ditemukan
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.nomor_surat}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(item.tanggal_surat)}</td>
                    <td className="px-4 py-3 text-slate-600">{item.pihak}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate" title={item.perihal}>
                      {item.perihal}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.file_name && (
                          <a
                            href={`/api/surat/${item.id}/file`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                            title="Unduh PDF"
                          >
                            ⬇️
                          </a>
                        )}
                        <Link
                          href={`/surat/${item.id}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                          title="Lihat / Edit"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-md p-1.5 text-(--danger) hover:bg-red-50"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-(--border) text-sm">
            <span className="text-slate-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-(--border) px-3 py-1.5 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-(--border) px-3 py-1.5 disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SuratListPage() {
  return (
    <Suspense>
      <SuratListInner />
    </Suspense>
  );
}
