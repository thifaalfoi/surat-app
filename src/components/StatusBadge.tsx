export function StatusBadge({ status }: { status: "DIPROSES" | "SELESAI" }) {
  const isDone = status === "SELESAI";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isDone
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isDone ? "bg-emerald-500" : "bg-amber-500"}`} />
      {isDone ? "Selesai" : "Diproses"}
    </span>
  );
}

export function JenisBadge({ jenis }: { jenis: "MASUK" | "KELUAR" }) {
  const isMasuk = jenis === "MASUK";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isMasuk
          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
          : "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
      }`}
    >
      {isMasuk ? "↓ Masuk" : "↑ Keluar"}
    </span>
  );
}
