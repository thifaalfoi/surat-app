// middleware/auth.js

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Anda tidak memiliki akses ke halaman tersebut.');
    return res.redirect('/');
  }
  next();
}

// Menyisipkan data user & flash message ke semua view secara otomatis
function injectLocals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
}

module.exports = { requireLogin, requireAdmin, injectLocals };
