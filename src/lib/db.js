// backend/lib/db.js
// Neon PostgreSQL client using the 'pg' driver
// Neon supports standard PostgreSQL connections with SSL

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected DB client error:", err);
});

/**
 * Execute a parameterized query
 * @param {string} text  - SQL string with $1, $2 placeholders
 * @param {Array}  params - Query parameters
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DB] ${duration}ms — ${text.slice(0, 80)}`);
    }
    return res;
  } catch (err) {
    console.error("[DB Error]", err.message, "\nQuery:", text);
    throw err;
  }
}

/**
 * Run multiple queries in a transaction
 * @param {Function} fn - async function that receives { query }
 */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn({ query: (text, params) => client.query(text, params) });
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { query, transaction, pool };