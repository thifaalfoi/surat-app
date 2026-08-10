import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await query(`SELECT file_name, file_type, file_data FROM surat WHERE id = $1`, [id]);
  const row = result.rows[0];

  if (!row || !row.file_data) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }

  return new NextResponse(row.file_data, {
    headers: {
      "Content-Type": row.file_type || "application/pdf",
      "Content-Disposition": `attachment; filename="${row.file_name || "surat.pdf"}"`,
    },
  });
}
