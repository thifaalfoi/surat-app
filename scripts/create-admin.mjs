// Jalankan: node scripts/create-admin.mjs
// Pastikan environment variable DATABASE_URL sudah diset (bisa lewat .env atau di-export manual).
// Contoh: DATABASE_URL=postgres://... ADMIN_USERNAME=admin ADMIN_PASSWORD=rahasia123 ADMIN_NAME="Admin Utama" node scripts/create-admin.mjs

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "admin123";
const name = process.env.ADMIN_NAME || "Administrator";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL belum diset. Tambahkan di .env.local atau export sebagai environment variable.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function main() {
  const hash = await bcrypt.hash(password, 10);

  const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
  if (existing.rows[0]) {
    await pool.query("UPDATE users SET password_hash = $1, name = $2, role = 'ADMIN' WHERE username = $3", [
      hash,
      name,
      username,
    ]);
    console.log(`✅ Password untuk user "${username}" berhasil diperbarui.`);
  } else {
    await pool.query(
      "INSERT INTO users (username, password_hash, name, role) VALUES ($1, $2, $3, 'ADMIN')",
      [username, hash, name]
    );
    console.log(`✅ User admin "${username}" berhasil dibuat.`);
  }

  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Gagal membuat user admin:", err.message);
  process.exit(1);
});
