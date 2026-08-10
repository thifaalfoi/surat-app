# SIMSurat — Manajemen Surat Masuk & Keluar

Aplikasi web untuk mengelola surat masuk dan surat keluar instansi. Dibangun dengan Next.js 16 (App Router), Tailwind CSS, dan PostgreSQL (lewat `pg`, tanpa ORM berat seperti Prisma — jadi tidak butuh proses build engine tambahan).

## Fitur

- Login admin/petugas (session JWT di cookie httpOnly)
- Input & edit surat masuk / surat keluar
- Field: nomor surat, tanggal surat, pengirim/penerima, perihal, status
- Upload & unduh file PDF (disimpan di database, maks. 10MB)
- Status: Diproses / Selesai
- Pencarian (nomor, pihak, perihal) & filter (jenis, status)
- Dashboard statistik (jumlah surat masuk/keluar, status, grafik 6 bulan terakhir)
- Riwayat aktivitas (login, logout, tambah/ubah/hapus surat)

## Struktur Penting

```
db/schema.sql             -> skema database, jalankan sekali di Postgres kamu
scripts/create-admin.mjs  -> script bikin/reset user admin pertama
src/lib/db.ts              -> koneksi Postgres (pool)
src/lib/auth.ts            -> hashing password & JWT session
src/proxy.ts                -> proteksi rute (dulu disebut "middleware")
src/app/api/...             -> semua REST API
src/app/...                 -> halaman (login, dashboard, surat, aktivitas)
```

## 1. Jalankan Secara Lokal (opsional, untuk uji coba)

Kamu butuh database Postgres — bisa Postgres lokal, atau langsung pakai Neon/Supabase gratis (lihat langkah 2 di bawah, bisa dipakai untuk lokal maupun produksi).

```bash
npm install
cp .env.example .env.local
# edit .env.local: isi DATABASE_URL dan JWT_SECRET
```

Jalankan skema database (lihat langkah 2), lalu:

```bash
node scripts/create-admin.mjs   # buat user admin pertama
npm run dev
```

Buka http://localhost:3000 lalu login dengan username/password yang kamu set di `.env.local` (default: `admin` / `admin123` jika tidak diubah).

## 2. Siapkan Database Postgres

Paling gampang pakai **Neon** (gratis, tinggal connect ke Vercel):

1. Buka https://neon.tech → buat akun → buat project baru.
2. Salin **Connection String** yang diberikan (formatnya `postgres://user:pass@host/db?sslmode=require`).
3. Buka SQL editor di Neon (atau pakai `psql`), lalu jalankan seluruh isi file `db/schema.sql` dari project ini. Ini akan membuat tabel `users`, `surat`, dan `activity_log`.

Alternatif lain yang juga bisa dipakai: **Vercel Postgres** (tab Storage di dashboard Vercel) atau **Supabase** — caranya sama: buat database, jalankan `db/schema.sql`, salin connection string-nya.

## 3. Deploy ke Vercel

### A. Push ke GitHub

```bash
cd surat-app
git init
git add .
git commit -m "Initial commit - SIMSurat"
git branch -M main
git remote add origin https://github.com/USERNAME/surat-app.git
git push -u origin main
```

### B. Import Project di Vercel

1. Buka https://vercel.com/new
2. Pilih **Import Git Repository**, pilih repo `surat-app` yang baru di-push.
3. Framework Preset akan otomatis terdeteksi sebagai **Next.js** — biarkan default.
4. Sebelum klik Deploy, buka bagian **Environment Variables** dan tambahkan:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | connection string Postgres dari langkah 2 |
   | `JWT_SECRET` | string acak & panjang, contoh generate: `openssl rand -base64 32` |

5. Klik **Deploy**. Tunggu proses build selesai (biasanya 1-2 menit).

### C. Buat User Admin Pertama

Karena database ada di cloud, jalankan script pembuatan admin dari komputer kamu (bukan dari Vercel), cukup arahkan ke `DATABASE_URL` yang sama:

```bash
# di folder project, lokal
DATABASE_URL="connection-string-dari-neon" \
ADMIN_USERNAME=admin \
ADMIN_PASSWORD="password-yang-kuat" \
ADMIN_NAME="Nama Admin" \
node scripts/create-admin.mjs
```

Setelah itu, buka domain Vercel kamu (misalnya `https://surat-app.vercel.app`) dan login dengan username/password tadi.

### D. (Opsional) Deploy via Vercel CLI

Alternatif tanpa GitHub:

```bash
npm i -g vercel
cd surat-app
vercel login
vercel            # deploy preview
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel --prod     # deploy ke production
```

## Menambah User Petugas Lain

Saat ini pembuatan user baru dilakukan lewat script `scripts/create-admin.mjs` (jalankan dengan `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_NAME` berbeda). Untuk kebutuhan produksi jangka panjang, pertimbangkan menambahkan halaman manajemen user khusus admin, atau insert manual lewat SQL dengan role `PETUGAS`.

## Catatan Keamanan

- Ganti `JWT_SECRET` dengan nilai acak yang kuat — jangan gunakan nilai contoh di `.env.example`.
- File PDF disimpan langsung di kolom `bytea` pada tabel `surat`. Untuk volume surat yang sangat besar dan sering, pertimbangkan migrasi ke object storage seperti Vercel Blob agar database tetap ringan.
- Cookie session bersifat `httpOnly` dan `secure` di production, jadi tidak bisa diakses lewat JavaScript di browser.
