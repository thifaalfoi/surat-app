# SIM Surat — Aplikasi Manajemen Surat Masuk & Surat Keluar

Aplikasi web untuk instansi yang membantu mengelola **surat masuk** dan **surat keluar**,
lengkap dengan alur **disposisi** ke bagian/departemen dan fitur **balas surat** antar bagian.

## Fitur

- Login admin (Tata Usaha) dan petugas per bagian
- Input surat masuk: nomor surat, tanggal, pengirim, perihal, upload file PDF
- **Disposisi**: TU mengarahkan surat masuk ke bagian tujuan tertentu
- Bagian tujuan bisa melihat surat yang masuk untuknya dan **membalas** langsung
  (balasan otomatis tercatat sebagai surat keluar dan tertaut ke surat masuk asal;
  status surat masuk otomatis menjadi "selesai")
- Input surat keluar mandiri (tidak harus balasan)
- Status surat: **diproses** / **selesai** (bisa diubah manual kapan saja)
- Pencarian & filter (nomor surat, pengirim/tujuan, perihal, status, bagian)
- Download file surat (PDF)
- Dashboard statistik (total surat, status, rekap per bagian)
- Riwayat aktivitas (log semua tindakan pengguna)
- Kelola bagian & akun petugas (khusus admin)

## Struktur Peran

| Peran | Bisa lakukan |
|---|---|
| **Admin (Tata Usaha)** | Input surat masuk, disposisi ke bagian, kelola bagian & akun petugas, lihat semua surat & riwayat aktivitas |
| **Petugas Bagian** | Melihat surat masuk yang didisposisikan ke bagiannya, membalas surat, membuat surat keluar atas nama bagiannya, mengubah status surat bagiannya |

Petugas bagian **tidak bisa** melihat/mengakses surat milik bagian lain.

## Menjalankan di Komputer Lokal

Prasyarat: [Node.js](https://nodejs.org) versi 18 ke atas.

```bash
# 1. Masuk ke folder proyek
cd surat-app

# 2. Install dependensi
npm install

# 3. Jalankan aplikasi
npm start
```

Aplikasi akan berjalan di **http://localhost:3000**

### Akun Demo (Bawaan)

| Username | Password | Peran | Bagian |
|---|---|---|---|
| `admin` | `admin123` | Admin / Tata Usaha | Tata Usaha |
| `umum`  | `umum123`  | Petugas Bagian | Bagian Umum |

> ⚠️ **Wajib diganti** sebelum dipakai sungguhan. Login sebagai admin lalu buat akun-akun baru
> lewat menu **Bagian & Petugas**, kemudian hapus/nonaktifkan akun demo di atas
> (langsung edit `data/db.json`, lihat bagian "Struktur Data" di bawah).

## Cara Kerja Alur Surat

1. **Admin/TU** login, lalu buka menu **Surat Masuk → Input Surat Masuk**.
2. TU mengisi data surat dan memilih **bagian tujuan** (disposisi), lalu simpan.
3. **Petugas bagian tujuan** login, melihat surat tersebut di menu **Surat Masuk** miliknya.
4. Petugas membuka detail surat lalu klik **Balas Surat** — form otomatis terisi
   sebagian (tujuan = pengirim asal), tinggal lengkapi nomor surat, tanggal, dan
   perihal balasan, lalu unggah file PDF balasan jika ada.
5. Setelah balasan disimpan:
   - Balasan muncul di **Surat Keluar**
   - Surat masuk asal otomatis berubah status jadi **selesai**
   - Balasan juga muncul di halaman detail surat masuk asal (tertaut)
6. Semua tindakan (login, input surat, disposisi, balasan, ubah status) tercatat di
   **Riwayat Aktivitas** (khusus admin).

## Struktur Data

Data disimpan sebagai file JSON di `data/db.json` (dibuat otomatis saat aplikasi
pertama kali dijalankan). Ini membuat aplikasi mudah dijalankan di hosting mana pun
tanpa perlu setup database terpisah (MySQL/PostgreSQL).

Struktur utama:
- `users` — akun admin & petugas (password di-hash dengan bcrypt)
- `bagian` — daftar bagian/departemen
- `suratMasuk` — data surat masuk (termasuk `bagian_tujuan_id` untuk disposisi)
- `suratKeluar` — data surat keluar (`surat_masuk_id` terisi jika ini balasan)
- `activityLog` — log aktivitas

File PDF yang diunggah disimpan di folder `uploads/`.

> Jika instansi Anda menginginkan jumlah pengguna/surat sangat besar (ribuan surat
> per hari, banyak pengguna bersamaan), struktur data ini bisa dipindahkan ke
> MySQL/PostgreSQL — skema tabelnya sudah mengikuti bentuk di atas sehingga migrasi
> relatif mudah dilakukan oleh developer.

## Konfigurasi Produksi (Deploy ke Server Instansi)

1. Set environment variable `SESSION_SECRET` dengan string acak yang rahasia:
   ```bash
   export SESSION_SECRET="ganti-dengan-string-acak-panjang"
   export PORT=3000
   npm start
   ```
2. Gunakan process manager seperti **PM2** agar aplikasi tetap berjalan:
   ```bash
   npm install -g pm2
   pm2 start server.js --name sim-surat
   pm2 save
   ```
3. Pasang **reverse proxy** (Nginx/Apache) di depan aplikasi dan aktifkan **HTTPS**
   (misalnya dengan Let's Encrypt) agar data surat & login terenkripsi saat dikirim.
4. Backup folder `data/` dan `uploads/` secara berkala (berisi seluruh data surat
   dan file PDF).
5. Untuk banyak pengguna bersamaan, pertimbangkan mengganti session store
   default (in-memory) dengan store yang persisten, misalnya `connect-sqlite3`
   atau Redis (`connect-redis`), agar sesi login tidak hilang saat aplikasi di-restart.

## Struktur Folder

```
surat-app/
├── server.js              # entry point aplikasi
├── db.js                  # inisialisasi & helper database (JSON)
├── middleware/
│   ├── auth.js             # cek login & role
│   └── upload.js           # konfigurasi upload file PDF
├── routes/
│   ├── auth.js              # login/logout
│   ├── dashboard.js         # statistik dashboard
│   ├── suratMasuk.js        # CRUD surat masuk + disposisi
│   ├── suratKeluar.js       # CRUD surat keluar + balasan
│   ├── bagian.js            # kelola bagian & petugas
│   └── activity.js          # riwayat aktivitas
├── views/                  # tampilan (EJS)
├── public/css/style.css    # styling
├── uploads/                 # file PDF yang diunggah
└── data/db.json             # database (dibuat otomatis)
```

## Teknologi

- **Express.js** — web framework
- **EJS** — template engine
- **lowdb** — database JSON ringan (tanpa perlu instalasi database terpisah)
- **bcryptjs** — hashing password
- **multer** — upload file
- **Bootstrap 5** — tampilan (dimuat via CDN)

## Kustomisasi Lanjutan

- Tambah bagian baru: login sebagai admin → menu **Bagian & Petugas** → Tambah Bagian
- Tambah akun petugas baru: halaman yang sama → Tambah Akun Petugas
- Ubah warna/branding: edit `public/css/style.css` (variabel `--brand-blue`, dsb.)
- Ubah nama instansi di judul: edit `views/layout.ejs` dan `views/login.ejs`
