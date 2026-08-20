const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, (req, res) => {
  const user = req.session.user;
  const isAdmin = user.role === 'admin';

  let suratMasuk = db.get('suratMasuk').value();
  let suratKeluar = db.get('suratKeluar').value();

  // Petugas bagian hanya melihat statistik surat yang berkaitan dengan bagiannya
  if (!isAdmin) {
    suratMasuk = suratMasuk.filter(s => s.bagian_tujuan_id === user.bagian_id);
    suratKeluar = suratKeluar.filter(s => s.bagian_id === user.bagian_id);
  }

  const stats = {
    totalMasuk: suratMasuk.length,
    totalKeluar: suratKeluar.length,
    masukDiproses: suratMasuk.filter(s => s.status === 'diproses').length,
    masukSelesai: suratMasuk.filter(s => s.status === 'selesai').length,
    keluarDiproses: suratKeluar.filter(s => s.status === 'diproses').length,
    keluarSelesai: suratKeluar.filter(s => s.status === 'selesai').length
  };

  // Statistik per bagian (hanya relevan untuk admin)
  const bagianList = db.get('bagian').value();
  const perBagian = bagianList.map(b => {
    const masukCount = db.get('suratMasuk').filter({ bagian_tujuan_id: b.id }).value().length;
    const keluarCount = db.get('suratKeluar').filter({ bagian_id: b.id }).value().length;
    return { ...b, masukCount, keluarCount };
  });

  const recentActivity = db.get('activityLog')
    .orderBy(['id'], ['desc'])
    .take(15)
    .value();

  const recentMasuk = [...suratMasuk].sort((a, b) => b.id - a.id).slice(0, 5);
  const recentKeluar = [...suratKeluar].sort((a, b) => b.id - a.id).slice(0, 5);

  res.render('dashboard', {
    title: 'Dashboard',
    stats,
    perBagian,
    recentActivity,
    recentMasuk,
    recentKeluar,
    isAdmin
  });
});

module.exports = router;
