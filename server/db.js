const pg = require('pg');
require('dotenv').config();

// PostgreSQL connection setup
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  db_schema: process.env.DB_SCHEMA,
  port: process.env.DB_PORT,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};