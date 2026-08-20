const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireLogin, requireAdmin } = require('../middleware/auth');

router.get('/', requireLogin, requireAdmin, (req, res) => {
  const logs = [...db.get('activityLog').value()].sort((a, b) => b.id - a.id);
  res.render('activity_log', { title: 'Riwayat Aktivitas', logs });
});

module.exports = router;
