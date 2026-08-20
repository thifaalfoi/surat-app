const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, logActivity } = require('../db');

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { title: 'Masuk', layout: false });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.get('users').find({ username }).value();

  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    req.flash('error', 'Username atau password salah.');
    return res.redirect('/login');
  }

  const bagian = db.get('bagian').find({ id: user.bagian_id }).value();

  req.session.user = {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    bagian_id: user.bagian_id,
    bagian_nama: bagian ? bagian.nama_bagian : '-'
  };

  logActivity(user.id, user.nama, 'LOGIN', `${user.nama} masuk ke sistem`);
  req.flash('success', `Selamat datang, ${user.nama}.`);
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  if (req.session.user) {
    logActivity(req.session.user.id, req.session.user.nama, 'LOGOUT', `${req.session.user.nama} keluar dari sistem`);
  }
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
