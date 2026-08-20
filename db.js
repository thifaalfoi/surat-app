// db.js
// Menggunakan lowdb (penyimpanan JSON di file) supaya aplikasi ini
// gampang dijalankan di server/hosting mana pun tanpa perlu database
// terpisah (MySQL/Postgres) atau modul native.
//
// Jika instansi Anda punya kebutuhan skala besar / banyak pengguna,
// struktur data di sini bisa dengan mudah dipindahkan ke MySQL/Postgres
// karena skema tabelnya sudah jelas (lihat README.md).

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'db.json');
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '{}');

const adapter = new FileSync(dbFile);
const db = low(adapter);

// Struktur data default
db.defaults({
  users: [],
  bagian: [],
  suratMasuk: [],
  suratKeluar: [],
  activityLog: [],
  counters: { users: 0, bagian: 0, suratMasuk: 0, suratKeluar: 0, activityLog: 0 }
}).write();

// Helper untuk membuat ID auto-increment sederhana per koleksi
function nextId(collection) {
  const current = db.get(`counters.${collection}`).value() || 0;
  const next = current + 1;
  db.set(`counters.${collection}`, next).write();
  return next;
}

// Seed data awal: 1 bagian "Tata Usaha" + akun admin, jika database masih kosong
function seedIfEmpty() {
  if (db.get('bagian').size().value() === 0) {
    const tuId = nextId('bagian');
    db.get('bagian').push({
      id: tuId,
      nama_bagian: 'Tata Usaha',
      kode: 'TU',
      created_at: new Date().toISOString()
    }).write();

    const umumId = nextId('bagian');
    db.get('bagian').push({
      id: umumId,
      nama_bagian: 'Bagian Umum',
      kode: 'UMUM',
      created_at: new Date().toISOString()
    }).write();

    const keuanganId = nextId('bagian');
    db.get('bagian').push({
      id: keuanganId,
      nama_bagian: 'Bagian Keuangan',
      kode: 'KEU',
      created_at: new Date().toISOString()
    }).write();

    if (db.get('users').size().value() === 0) {
      const adminId = nextId('users');
      db.get('users').push({
        id: adminId,
        username: 'admin',
        password_hash: bcrypt.hashSync('admin123', 10),
        nama: 'Administrator TU',
        role: 'admin', // admin = petugas Tata Usaha, akses penuh
        bagian_id: tuId,
        created_at: new Date().toISOString()
      }).write();

      const petugasId = nextId('users');
      db.get('users').push({
        id: petugasId,
        username: 'umum',
        password_hash: bcrypt.hashSync('umum123', 10),
        nama: 'Petugas Bagian Umum',
        role: 'petugas',
        bagian_id: umumId,
        created_at: new Date().toISOString()
      }).write();
    }
  }
}

seedIfEmpty();

function logActivity(userId, userNama, action, detail) {
  db.get('activityLog').push({
    id: nextId('activityLog'),
    user_id: userId,
    user_nama: userNama,
    action,
    detail,
    created_at: new Date().toISOString()
  }).write();
}

module.exports = { db, nextId, logActivity };
