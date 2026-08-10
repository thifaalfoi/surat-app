import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const [totalMasuk, totalKeluar, diproses, selesai, perBulan] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM surat WHERE jenis = 'MASUK'`),
    query(`SELECT COUNT(*)::int AS count FROM surat WHERE jenis = 'KELUAR'`),
    query(`SELECT COUNT(*)::int AS count FROM surat WHERE status = 'DIPROSES'`),
    query(`SELECT COUNT(*)::int AS count FROM surat WHERE status = 'SELESAI'`),
    query(`
      SELECT to_char(date_trunc('month', tanggal_surat), 'YYYY-MM') AS bulan,
             jenis,
             COUNT(*)::int AS count
      FROM surat
      WHERE tanggal_surat >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `),
  ]);

  return NextResponse.json({
    totalMasuk: totalMasuk.rows[0].count,
    totalKeluar: totalKeluar.rows[0].count,
    diproses: diproses.rows[0].count,
    selesai: selesai.rows[0].count,
    perBulan: perBulan.rows,
  });
}
