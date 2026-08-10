import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jenis = searchParams.get("jenis"); // MASUK | KELUAR | null
  const status = searchParams.get("status"); // DIPROSES | SELESAI | null
  const search = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: any[] = [];

  if (jenis === "MASUK" || jenis === "KELUAR") {
    params.push(jenis);
    conditions.push(`jenis = $${params.length}`);
  }
  if (status === "DIPROSES" || status === "SELESAI") {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(`(nomor_surat ILIKE $${idx} OR pihak ILIKE $${idx} OR perihal ILIKE $${idx})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(`SELECT COUNT(*)::int AS count FROM surat ${whereClause}`, params);
  const total = countResult.rows[0].count;

  params.push(pageSize);
  params.push(offset);
  const dataResult = await query(
    `SELECT s.id, s.jenis, s.nomor_surat, s.tanggal_surat, s.pihak, s.perihal, s.status,
            s.file_name, s.file_type, s.created_at, s.updated_at,
            u.name AS created_by_name
     FROM surat s
     JOIN users u ON u.id = s.created_by
     ${whereClause}
     ORDER BY s.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return NextResponse.json({
    data: dataResult.rows,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const jenis = String(form.get("jenis") || "");
    const nomorSurat = String(form.get("nomorSurat") || "").trim();
    const tanggalSurat = String(form.get("tanggalSurat") || "");
    const pihak = String(form.get("pihak") || "").trim();
    const perihal = String(form.get("perihal") || "").trim();
    const status = String(form.get("status") || "DIPROSES");
    const file = form.get("file") as File | null;

    if (!["MASUK", "KELUAR"].includes(jenis)) {
      return NextResponse.json({ error: "Jenis surat tidak valid" }, { status: 400 });
    }
    if (!nomorSurat || !tanggalSurat || !pihak || !perihal) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }
    if (!["DIPROSES", "SELESAI"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileBuffer: Buffer | null = null;

    if (file && file.size > 0) {
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "File harus berformat PDF" }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
      }
      fileName = file.name;
      fileType = file.type;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    }

    const result = await query(
      `INSERT INTO surat (jenis, nomor_surat, tanggal_surat, pihak, perihal, status, file_name, file_type, file_data, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, jenis, nomor_surat, tanggal_surat, pihak, perihal, status, file_name, file_type, created_at, updated_at`,
      [jenis, nomorSurat, tanggalSurat, pihak, perihal, status, fileName, fileType, fileBuffer, user.sub]
    );

    const created = result.rows[0];
    await logActivity(
      user.sub,
      "CREATE_SURAT",
      `${user.name} menambahkan surat ${jenis === "MASUK" ? "masuk" : "keluar"} nomor ${nomorSurat}`
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
