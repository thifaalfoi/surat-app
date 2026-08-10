"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

function SuratForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultJenis = searchParams.get("jenis") === "KELUAR" ? "KELUAR" : "MASUK";

  const [jenis, setJenis] = useState<"MASUK" | "KELUAR">(defaultJenis);
  const [nomorSurat, setNomorSurat] = useState("");
  const [tanggalSurat, setTanggalSurat] = useState("");
  const [pihak, setPihak] = useState("");
  const [perihal, setPerihal] = useState("");
  const [status, setStatus] = useState("DIPROSES");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pihakLabel = jenis === "MASUK" ? "Pengirim" : "Penerima";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData();
    form.set("jenis", jenis);
    form.set("nomorSurat", nomorSurat);
    form.set("tanggalSurat", tanggalSurat);
    form.set("pihak", pihak);
    form.set("perihal", perihal);
    form.set("status", status);
    if (file) form.set("file", file);

    const res = await fetch("/api/surat", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Gagal menyimpan surat");
      return;
    }
    router.push(`/surat?jenis=${jenis}`);
    router.refresh();
  }

  return (
    <AppShell>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-(--navy)">Tambah Surat Baru</h1>
          <p className="text-sm text-slate-500 mt-0.5">Isi data surat masuk atau surat keluar</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-(--border) p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Surat</label>
            <div className="flex gap-2">
              {(["MASUK", "KELUAR"] as const).map((j) => (
                <button
                  type="button"
                  key={j}
                  onClick={() => setJenis(j)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    jenis === j
                      ? "border-(--accent) bg-(--accent)/10 text-(--accent)"
                      : "border-(--border) text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {j === "MASUK" ? "↓ Surat Masuk" : "↑ Surat Keluar"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Surat</label>
              <input
                required
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full rounded-lg border border-(--border) px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
                placeholder="mis. 001/SK/VIII/2026"
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
              placeholder={jenis === "MASUK" ? "Nama instansi/orang pengirim" : "Nama instansi/orang penerima"}
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
              placeholder="Ringkasan isi/perihal surat"
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">File PDF (opsional)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-(--border) px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
              />
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
              disabled={loading}
              className="rounded-lg bg-(--accent) text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Surat"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default function SuratBaruPage() {
  return (
    <Suspense>
      <SuratForm />
    </Suspense>
  );
}
