const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const { injectLocals } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'ganti-rahasia-ini-di-produksi',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // sesi berlaku 8 jam
}));
app.use(flash());
app.use(injectLocals);

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/surat-masuk', require('./routes/suratMasuk'));
app.use('/surat-keluar', require('./routes/suratKeluar'));
app.use('/bagian', require('./routes/bagian'));
app.use('/aktivitas', require('./routes/activity'));

// 404
app.use((req, res) => {
  res.status(404).send('Halaman tidak ditemukan.');
});

// Error handler (mis. error upload file)
app.use((err, req, res, next) => {
  console.error(err);
  req.flash('error', err.message || 'Terjadi kesalahan pada server.');
  res.redirect('back');
});

app.listen(PORT, () => {
  console.log(`Aplikasi Surat Masuk & Keluar berjalan di http://localhost:${PORT}`);
});
