const { Pool } = require('pg');

// Newer pg-connection-string versions treat sslmode=require (as used in
// Aiven's connection string) as an alias for verify-full, which overrides
// the explicit rejectUnauthorized: false below and fails with
// "self-signed certificate in certificate chain". Stripping sslmode from
// the URL and relying solely on the explicit `ssl` option avoids that.
function stripSslMode(connectionString) {
  if (!connectionString) return connectionString;
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return url.toString();
}

const pool = new Pool({
  connectionString: stripSslMode(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});

module.exports = { pool };
