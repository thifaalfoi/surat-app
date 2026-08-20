const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db, nextId, logActivity } = require('../db');
const { requireLogin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// LIST
router.get('/', requireLogin, (req, res) => {
  const user = req.session.user;
  const { q, status, bagian_id } = req.query;

  let items = db.get('suratKeluar').value();

  if (user.role !== 'admin') {
    items = items.filter(s => s.bagian_id === user.bagian_id);
  } else if (bagian_id) {
    items = items.filter(s => String(s.bagian_id) === String(bagian_id));
  }

  if (status) items = items.filter(s => s.status === status);

  if (q) {
    const qLower = q.toLowerCase();
    items = items.filter(s =>
      (s.nomor_surat || '').toLowerCase().includes(qLower) ||
      (s.tujuan || '').toLowerCase().includes(qLower) ||
      (s.perihal || '').toLowerCase().includes(qLower)
    );
  }

  items = [...items].sort((a, b) => b.id - a.id);

  const bagianList = db.get('bagian').value();
  const bagianMap = {};
  bagianList.forEach(b => bagianMap[b.id] = b.nama_bagian);

  res.render('surat_keluar_list', {
    title: 'Surat Keluar',
    items,
    bagianMap,
    bagianList,
    filters: { q: q || '', status: status || '', bagian_id: bagian_id || '' }
  });
});

// FORM TAMBAH - bisa dipakai siapa saja yang login (petugas bagian buat surat keluar untuk bagiannya)
// Jika ?balasan_dari=ID diberikan, form otomatis terisi sebagai balasan surat masuk tsb.
router.get('/baru', requireLogin, (req, res) => {
  const user = req.session.user;
  let suratMasukAsal = null;

  if (req.query.balasan_dari) {
    suratMasukAsal = db.get('suratMasuk').find({ id: Number(req.query.balasan_dari) }).value();
    if (suratMasukAsal && user.role !== 'admin' && suratMasukAsal.bagian_tujuan_id !== user.bagian_id) {
      suratMasukAsal = null;
    }
  }

  const bagianList = db.get('bagian').value();
  res.render('surat_keluar_form', {
    title: suratMasukAsal ? 'Balas Surat' : 'Input Surat Keluar',
    suratMasukAsal,
    bagianList
  });
});

// SIMPAN
router.post('/', requireLogin, upload.single('file'), (req, res) => {
  const user = req.session.user;
  const { nomor_surat, tanggal_surat, tujuan, perihal, surat_masuk_id, bagian_id } = req.body;

  if (!nomor_surat || !tanggal_surat || !tujuan || !perihal) {
    req.flash('error', 'Semua field wajib diisi.');
    return res.redirect('/surat-keluar/baru');
  }

  // Petugas non-admin hanya bisa membuat surat keluar atas nama bagiannya sendiri
  const finalBagianId = user.role === 'admin' && bagian_id ? Number(bagian_id) : user.bagian_id;

  const id = nextId('suratKeluar');
  db.get('suratKeluar').push({
    id,
    nomor_surat,
    tanggal_surat,
    tujuan,
    perihal,
    file_path: req.file ? req.file.filename : null,
    file_original_name: req.file ? req.file.originalname : null,
    bagian_id: finalBagianId,
    surat_masuk_id: surat_masuk_id ? Number(surat_masuk_id) : null,
    status: 'diproses',
    created_by: user.id,
    created_by_nama: user.nama,
    created_at: new Date().toISOString()
  }).write();

  logActivity(user.id, user.nama, 'SURAT_KELUAR_BARU',
    `Membuat surat keluar "${perihal}" (No. ${nomor_surat}) untuk ${tujuan}` +
    (surat_masuk_id ? ` sebagai balasan surat masuk #${surat_masuk_id}` : ''));

  // Jika ini balasan, tandai surat masuk asal sebagai selesai otomatis
  if (surat_masuk_id) {
    db.get('suratMasuk').find({ id: Number(surat_masuk_id) }).assign({ status: 'selesai' }).write();
  }

  req.flash('success', 'Surat keluar berhasil disimpan.');
  res.redirect('/surat-keluar');
});

// DETAIL
router.get('/:id', requireLogin, (req, res) => {
  const item = db.get('suratKeluar').find({ id: Number(req.params.id) }).value();
  if (!item) {
    req.flash('error', 'Surat tidak ditemukan.');
    return res.redirect('/surat-keluar');
  }
  const user = req.session.user;
  if (user.role !== 'admin' && item.bagian_id !== user.bagian_id) {
    req.flash('error', 'Anda tidak memiliki akses ke surat tersebut.');
    return res.redirect('/surat-keluar');
  }

  const bagian = db.get('bagian').find({ id: item.bagian_id }).value();
  const suratMasukAsal = item.surat_masuk_id
    ? db.get('suratMasuk').find({ id: item.surat_masuk_id }).value()
    : null;

  res.render('surat_keluar_detail', {
    title: 'Detail Surat Keluar',
    item,
    bagian,
    suratMasukAsal
  });
});

// UPDATE STATUS
router.post('/:id/status', requireLogin, (req, res) => {
  const item = db.get('suratKeluar').find({ id: Number(req.params.id) }).value();
  if (!item) {
    req.flash('error', 'Surat tidak ditemukan.');
    return res.redirect('/surat-keluar');
  }
  const user = req.session.user;
  if (user.role !== 'admin' && item.bagian_id !== user.bagian_id) {
    req.flash('error', 'Anda tidak memiliki akses ke surat tersebut.');
    return res.redirect('/surat-keluar');
  }

  const { status } = req.body;
  db.get('suratKeluar').find({ id: item.id }).assign({ status }).write();

  logActivity(user.id, user.nama, 'SURAT_KELUAR_STATUS',
    `Mengubah status surat keluar "${item.perihal}" (No. ${item.nomor_surat}) menjadi ${status}`);

  req.flash('success', 'Status surat berhasil diperbarui.');
  res.redirect(`/surat-keluar/${item.id}`);
});

// DOWNLOAD
router.get('/:id/download', requireLogin, (req, res) => {
  const item = db.get('suratKeluar').find({ id: Number(req.params.id) }).value();
  if (!item || !item.file_path) {
    req.flash('error', 'File tidak ditemukan.');
    return res.redirect('/surat-keluar');
  }
  const filePath = path.join(__dirname, '..', 'uploads', item.file_path);
  if (!fs.existsSync(filePath)) {
    req.flash('error', 'File tidak ditemukan di server.');
    return res.redirect(`/surat-keluar/${item.id}`);
  }
  res.download(filePath, item.file_original_name || item.file_path);
});

module.exports = router;
