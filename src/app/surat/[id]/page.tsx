"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { toInputDate } from "@/lib/format";

type SuratDetail = {
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

export default function SuratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<SuratDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [nomorSurat, setNomorSurat] = useState("");
  const [tanggalSurat, setTanggalSurat] = useState("");
  const [pihak, setPihak] = useState("");
  const [perihal, setPerihal] = useState("");
  const [status, setStatus] = useState("DIPROSES");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetch(`/api/surat/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        const s: SuratDetail = d.data;
        setData(s);
        setNomorSurat(s.nomor_surat);
        setTanggalSurat(toInputDate(s.tanggal_surat));
        setPihak(s.pihak);
        setPerihal(s.perihal);
        setStatus(s.status);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData();
    form.set("nomorSurat", nomorSurat);
    form.set("tanggalSurat", tanggalSurat);
    form.set("pihak", pihak);
    form.set("perihal", perihal);
    form.set("status", status);
    if (file) form.set("file", file);

    const res = await fetch(`/api/surat/${id}`, { method: "PUT", body: form });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(d.error || "Gagal menyimpan perubahan");
      return;
    }
    router.push(`/surat?jenis=${data?.jenis}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus surat ini?")) return;
    const res = await fetch(`/api/surat/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/surat?jenis=${data?.jenis}`);
      router.refresh();
    } else {
      alert("Gagal menghapus surat");
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-slate-400">Memuat...</p>
      </AppShell>
    );
  }

  if (notFound || !data) {
    return (
      <AppShell>
        <p className="text-sm text-slate-400">Surat tidak ditemukan.</p>
      </AppShell>
    );
  }

  const pihakLabel = data.jenis === "MASUK" ? "Pengirim" : "Penerima";

  return (
    <AppShell>
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-(--navy)">Detail Surat</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Dibuat oleh {data.created_by_name} · {data.jenis === "MASUK" ? "Surat Masuk" : "Surat Keluar"}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-200 text-(--danger) px-3 py-2 text-sm hover:bg-red-50"
          >
            Hapus Surat
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl border border-(--border) p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Surat</label>
              <input
                required
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full rounded-lg border border-(--border) px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Surat</label>
              <input
                type="date"
                required
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                className="w-full rounded-lg border border-(--border) px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{pihakLabel}</label>
            <input
              required
              value={pihak}
              onChange={(e) => setPihak(e.target.value)}
              className="w-full rounded-lg border border-(--border) px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Perihal</label>
            <textarea
              required
              rows={3}
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              className="w-full rounded-lg border border-(--border) px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-(--border) px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-(--accent)"
              >
                <option value="DIPROSES">Diproses</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                File PDF {data.file_name ? "(ganti file)" : "(opsional)"}
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-(--border) px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
              />
              {data.file_name && !file && (
                <a
                  href={`/api/surat/${id}/file`}
                  className="mt-1.5 inline-block text-xs text-(--accent) hover:underline"
                >
                  📎 {data.file_name} — unduh file saat ini
                </a>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-(--danger)">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-(--border) px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-(--accent) text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
