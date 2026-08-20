const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db, nextId, logActivity } = require('../db');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// LIST
router.get('/', requireLogin, (req, res) => {
  const user = req.session.user;
  const { q, status, bagian_id } = req.query;

  let items = db.get('suratMasuk').value();

  // Petugas bagian hanya melihat surat yang didisposisikan ke bagiannya.
  // Admin (Tata Usaha) melihat semua surat masuk.
  if (user.role !== 'admin') {
    items = items.filter(s => s.bagian_tujuan_id === user.bagian_id);
  } else if (bagian_id) {
    items = items.filter(s => String(s.bagian_tujuan_id) === String(bagian_id));
  }

  if (status) items = items.filter(s => s.status === status);

  if (q) {
    const qLower = q.toLowerCase();
    items = items.filter(s =>
      (s.nomor_surat || '').toLowerCase().includes(qLower) ||
      (s.pengirim || '').toLowerCase().includes(qLower) ||
      (s.perihal || '').toLowerCase().includes(qLower)
    );
  }

  items = [...items].sort((a, b) => b.id - a.id);

  const bagianList = db.get('bagian').value();
  const bagianMap = {};
  bagianList.forEach(b => bagianMap[b.id] = b.nama_bagian);

  res.render('surat_masuk_list', {
    title: 'Surat Masuk',
    items,
    bagianMap,
    bagianList,
    filters: { q: q || '', status: status || '', bagian_id: bagian_id || '' }
  });
});

// FORM TAMBAH (hanya admin/TU yang mencatat surat masuk)
router.get('/baru', requireLogin, requireAdmin, (req, res) => {
  const bagianList = db.get('bagian').value();
  res.render('surat_masuk_form', { title: 'Input Surat Masuk', bagianList });
});

// SIMPAN
router.post('/', requireLogin, requireAdmin, upload.single('file'), (req, res) => {
  const { nomor_surat, tanggal_surat, pengirim, perihal, bagian_tujuan_id } = req.body;

  if (!nomor_surat || !tanggal_surat || !pengirim || !perihal || !bagian_tujuan_id) {
    req.flash('error', 'Semua field wajib diisi.');
    return res.redirect('/surat-masuk/baru');
  }

  const id = nextId('suratMasuk');
  const bagian = db.get('bagian').find({ id: Number(bagian_tujuan_id) }).value();

  db.get('suratMasuk').push({
    id,
    nomor_surat,
    tanggal_surat,
    tanggal_diterima: new Date().toISOString().slice(0, 10),
    pengirim,
    perihal,
    file_path: req.file ? req.file.filename : null,
    file_original_name: req.file ? req.file.originalname : null,
    bagian_tujuan_id: Number(bagian_tujuan_id),
    status: 'diproses',
    created_by: req.session.user.id,
    created_by_nama: req.session.user.nama,
    created_at: new Date().toISOString()
  }).write();

  logActivity(req.session.user.id, req.session.user.nama, 'SURAT_MASUK_BARU',
    `Mencatat surat masuk "${perihal}" (No. ${nomor_surat}) dan mendisposisikan ke ${bagian ? bagian.nama_bagian : '-'}`);

  req.flash('success', 'Surat masuk berhasil dicatat dan didisposisikan.');
  res.redirect('/surat-masuk');
});

// DETAIL
router.get('/:id', requireLogin, (req, res) => {
  const item = db.get('suratMasuk').find({ id: Number(req.params.id) }).value();
  if (!item) {
    req.flash('error', 'Surat tidak ditemukan.');
    return res.redirect('/surat-masuk');
  }

  const user = req.session.user;
  if (user.role !== 'admin' && item.bagian_tujuan_id !== user.bagian_id) {
    req.flash('error', 'Anda tidak memiliki akses ke surat tersebut.');
    return res.redirect('/surat-masuk');
  }

  const bagian = db.get('bagian').find({ id: item.bagian_tujuan_id }).value();
  const balasanList = db.get('suratKeluar').filter({ surat_masuk_id: item.id }).value();

  res.render('surat_masuk_detail', {
    title: 'Detail Surat Masuk',
    item,
    bagian,
    balasanList
  });
});

// UPDATE STATUS
router.post('/:id/status', requireLogin, (req, res) => {
  const item = db.get('suratMasuk').find({ id: Number(req.params.id) }).value();
  if (!item) {
    req.flash('error', 'Surat tidak ditemukan.');
    return res.redirect('/surat-masuk');
  }
  const user = req.session.user;
  if (user.role !== 'admin' && item.bagian_tujuan_id !== user.bagian_id) {
    req.flash('error', 'Anda tidak memiliki akses ke surat tersebut.');
    return res.redirect('/surat-masuk');
  }

  const { status } = req.body;
  db.get('suratMasuk').find({ id: item.id }).assign({ status }).write();

  logActivity(user.id, user.nama, 'SURAT_MASUK_STATUS',
    `Mengubah status surat masuk "${item.perihal}" (No. ${item.nomor_surat}) menjadi ${status}`);

  req.flash('success', 'Status surat berhasil diperbarui.');
  res.redirect(`/surat-masuk/${item.id}`);
});

// DOWNLOAD
router.get('/:id/download', requireLogin, (req, res) => {
  const item = db.get('suratMasuk').find({ id: Number(req.params.id) }).value();
  if (!item || !item.file_path) {
    req.flash('error', 'File tidak ditemukan.');
    return res.redirect('/surat-masuk');
  }
  const filePath = path.join(__dirname, '..', 'uploads', item.file_path);
  if (!fs.existsSync(filePath)) {
    req.flash('error', 'File tidak ditemukan di server.');
    return res.redirect(`/surat-masuk/${item.id}`);
  }
  res.download(filePath, item.file_original_name || item.file_path);
});

module.exports = router;
