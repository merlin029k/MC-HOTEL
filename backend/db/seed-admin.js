// Creates (or updates) one admin_users row so /api/admin/login has something to authenticate against.
// Usage: node db/seed-admin.js "Jane Doe" jane@example.com "some-password"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error('Usage: node db/seed-admin.js "<name>" <email> <password>');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await pool.query(
      `INSERT INTO admin_users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
      [name, email, passwordHash]
    );
    console.log(`Admin user ready: ${email}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed to seed admin user:', err.message);
  process.exit(1);
});
