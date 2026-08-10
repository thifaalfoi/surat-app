import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await query(
    `SELECT s.id, s.jenis, s.nomor_surat, s.tanggal_surat, s.pihak, s.perihal, s.status,
            s.file_name, s.file_type, s.created_at, s.updated_at, u.name AS created_by_name
     FROM surat s JOIN users u ON u.id = s.created_by WHERE s.id = $1`,
    [id]
  );
  const surat = result.rows[0];
  if (!surat) return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ data: surat });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const form = await req.formData();
    const nomorSurat = String(form.get("nomorSurat") || "").trim();
    const tanggalSurat = String(form.get("tanggalSurat") || "");
    const pihak = String(form.get("pihak") || "").trim();
    const perihal = String(form.get("perihal") || "").trim();
    const status = String(form.get("status") || "DIPROSES");
    const file = form.get("file") as File | null;

    if (!nomorSurat || !tanggalSurat || !pihak || !perihal) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }
    if (!["DIPROSES", "SELESAI"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const existing = await query(`SELECT id FROM surat WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
    }

    if (file && file.size > 0) {
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "File harus berformat PDF" }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
      }
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await query(
        `UPDATE surat SET nomor_surat=$1, tanggal_surat=$2, pihak=$3, perihal=$4, status=$5,
                          file_name=$6, file_type=$7, file_data=$8 WHERE id=$9`,
        [nomorSurat, tanggalSurat, pihak, perihal, status, file.name, file.type, fileBuffer, id]
      );
    } else {
      await query(
        `UPDATE surat SET nomor_surat=$1, tanggal_surat=$2, pihak=$3, perihal=$4, status=$5 WHERE id=$6`,
        [nomorSurat, tanggalSurat, pihak, perihal, status, id]
      );
    }

    await logActivity(user.sub, "UPDATE_SURAT", `${user.name} memperbarui surat nomor ${nomorSurat}`);

    const result = await query(
      `SELECT s.id, s.jenis, s.nomor_surat, s.tanggal_surat, s.pihak, s.perihal, s.status,
              s.file_name, s.file_type, s.created_at, s.updated_at
       FROM surat s WHERE s.id = $1`,
      [id]
    );
    return NextResponse.json({ data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await query(`SELECT nomor_surat FROM surat WHERE id = $1`, [id]);
  if (!existing.rows[0]) {
    return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
  }

  await query(`DELETE FROM surat WHERE id = $1`, [id]);
  await logActivity(user.sub, "DELETE_SURAT", `${user.name} menghapus surat nomor ${existing.rows[0].nomor_surat}`);

  return NextResponse.json({ ok: true });
}
