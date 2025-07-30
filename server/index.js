const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("./db"); 
const authMiddleware = require("./authMiddleware");
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// Register
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      "INSERT INTO geoguessr_schema.users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, hash]
    );
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "User already exists" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await db.query(
    "SELECT * FROM geoguessr_schema.users WHERE email = $1",
    [email]
  );
  if (result.rows.length === 0)
    return res.status(400).json({ error: "User not found" });

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return res.status(401).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});

// Submit game result
app.post("/api/submit", authMiddleware, async (req, res) => {
  const {
    guessed_lat,
    guessed_lng,
    actual_lat,
    actual_lng,
    guessed_floor,
    actual_floor,
    distance_meters,
  } = req.body;
  await db.query(
    `INSERT INTO geoguessr_schema.results 
     (user_id, guessed_lat, guessed_lng, actual_lat, actual_lng, guessed_floor, actual_floor, distance_meters) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      req.userId,
      guessed_lat,
      guessed_lng,
      actual_lat,
      actual_lng,
      guessed_floor,
      actual_floor,
      distance_meters,
    ]
  );
  res.json({ success: true });
});

// Get leaderboard
app.get("/api/leaderboard", async (req, res) => {
  const result = await db.query(
    `SELECT user_id, AVG(distance_meters) as avg_distance 
     FROM geoguessr_schema.results 
     GROUP BY user_id 
     ORDER BY avg_distance ASC 
     LIMIT 10`
  );
  res.json(result.rows);
});

app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, email FROM geoguessr_schema.users WHERE id = $1",
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get results for user
app.get("/api/my-results", authMiddleware, async (req, res) => {
  const result = await db.query(
    `SELECT * FROM geoguessr_schema.results WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
});

// Start server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
