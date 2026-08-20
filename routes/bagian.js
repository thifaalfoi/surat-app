const express = require('express');
const router = express.Router();
const { db, nextId, logActivity } = require('../db');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// LIST bagian + users
router.get('/', requireLogin, requireAdmin, (req, res) => {
  const bagianList = db.get('bagian').value();
  const users = db.get('users').value();
  const bagianMap = {};
  bagianList.forEach(b => bagianMap[b.id] = b.nama_bagian);

  res.render('bagian_list', { title: 'Kelola Bagian & Petugas', bagianList, users, bagianMap });
});

// TAMBAH BAGIAN
router.post('/', requireLogin, requireAdmin, (req, res) => {
  const { nama_bagian, kode } = req.body;
  if (!nama_bagian || !kode) {
    req.flash('error', 'Nama bagian dan kode wajib diisi.');
    return res.redirect('/bagian');
  }
  const id = nextId('bagian');
  db.get('bagian').push({
    id, nama_bagian, kode: kode.toUpperCase(), created_at: new Date().toISOString()
  }).write();

  logActivity(req.session.user.id, req.session.user.nama, 'BAGIAN_BARU', `Menambahkan bagian baru: ${nama_bagian}`);
  req.flash('success', 'Bagian berhasil ditambahkan.');
  res.redirect('/bagian');
});

// TAMBAH USER / PETUGAS
router.post('/users', requireLogin, requireAdmin, (req, res) => {
  const { username, password, nama, role, bagian_id } = req.body;
  if (!username || !password || !nama || !role || !bagian_id) {
    req.flash('error', 'Semua field wajib diisi.');
    return res.redirect('/bagian');
  }

  const existing = db.get('users').find({ username }).value();
  if (existing) {
    req.flash('error', 'Username sudah digunakan.');
    return res.redirect('/bagian');
  }

  const id = nextId('users');
  db.get('users').push({
    id,
    username,
    password_hash: bcrypt.hashSync(password, 10),
    nama,
    role,
    bagian_id: Number(bagian_id),
    created_at: new Date().toISOString()
  }).write();

  logActivity(req.session.user.id, req.session.user.nama, 'USER_BARU', `Menambahkan akun petugas baru: ${nama} (${username})`);
  req.flash('success', 'Akun petugas berhasil ditambahkan.');
  res.redirect('/bagian');
});

module.exports = router;
