require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query('SELECT id, username FROM "User"');
  for (const row of res.rows) {
    const token = jwt.sign(
      { id: row.id, username: row.username },
      process.env.JWT_SECRET || 'super_secret_dev_key'
    );
    const resp = await fetch('http://localhost:3000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await resp.text();
    console.log('User', row.username, '->', resp.status, text);
  }
  process.exit(0);
}

test().catch(console.error);
