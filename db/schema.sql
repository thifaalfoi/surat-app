-- Skema database untuk aplikasi Manajemen Surat Masuk & Keluar
-- Jalankan file ini sekali di database Postgres kamu (Neon / Vercel Postgres / Supabase / lainnya)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PETUGAS' CHECK (role IN ('ADMIN', 'PETUGAS')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS surat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis TEXT NOT NULL CHECK (jenis IN ('MASUK', 'KELUAR')),
  nomor_surat TEXT NOT NULL,
  tanggal_surat DATE NOT NULL,
  pihak TEXT NOT NULL, -- Pengirim (jika MASUK) atau Penerima (jika KELUAR)
  perihal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DIPROSES' CHECK (status IN ('DIPROSES', 'SELESAI')),
  file_name TEXT,
  file_type TEXT,
  file_data BYTEA,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_surat_jenis ON surat(jenis);
CREATE INDEX IF NOT EXISTS idx_surat_status ON surat(status);
CREATE INDEX IF NOT EXISTS idx_surat_nomor ON surat(nomor_surat);
CREATE INDEX IF NOT EXISTS idx_surat_tanggal ON surat(tanggal_surat);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_surat_updated_at ON surat;
CREATE TRIGGER trg_surat_updated_at
BEFORE UPDATE ON surat
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
