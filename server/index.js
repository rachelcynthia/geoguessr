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
  const { email, password, name, city, country, profile_image } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const query = `
      INSERT INTO geoguessr_schema.users 
      (email, password_hash, name, city, country, profile_image) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id
    `;

    const values = [email, hash, name, city, country, profile_image || null];
    const result = await db.query(query, values);

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

  try {
    // Fetch user by email
    const userResult = await db.query(
      "SELECT * FROM geoguessr_schema.users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userResult.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.json({
      token,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

//Profile
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const userResult = await db.query(
      "SELECT name, email, city, country, profile_image FROM geoguessr_schema.users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0];

    const attemptsCount = await db.query(
      `SELECT COUNT(*) AS total_attempts
       FROM geoguessr_schema.results
       WHERE user_id = $1`,
      [userId]
    );

    const attemptsData = await db.query(
      `SELECT guessed_lat, guessed_lng, actual_lat, actual_lng,
              guessed_floor, actual_floor, distance_meters
       FROM geoguessr_schema.results
       WHERE user_id = $1
       ORDER BY id DESC`,
      [userId]
    );

    const globalRankQuery = await db.query(
      `WITH ranked AS (
         SELECT user_id, RANK() OVER (ORDER BY AVG(distance_meters) ASC) AS rank
         FROM geoguessr_schema.results
         GROUP BY user_id
       )
       SELECT rank FROM ranked WHERE user_id = $1`,
      [userId]
    );

    const countryRankQuery = await db.query(
      `WITH ranked AS (
         SELECT r.user_id, RANK() OVER (ORDER BY AVG(r.distance_meters) ASC) AS rank
         FROM geoguessr_schema.results r
         JOIN geoguessr_schema.users u ON r.user_id = u.id
         WHERE u.country = $2
         GROUP BY r.user_id
       )
       SELECT rank FROM ranked WHERE user_id = $1`,
      [userId, user.country]
    );

    const profileScoreQuery = await db.query(
      `SELECT COALESCE(SUM(score), 0) AS total_score
       FROM geoguessr_schema.results
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      name: user.name,
      email: user.email,
      city: user.city,
      country: user.country,
      profile_image: user.profile_image,
      total_attempts: parseInt(attemptsCount.rows[0].total_attempts, 10),
      successful_attempts: attemptsData.rows.filter(a => a.distance_meters <= 10).length,
      failed_attempts: attemptsData.rows.filter(a => a.distance_meters > 10).length,
      global_rank: globalRankQuery.rows[0]?.rank || null,
      country_rank: countryRankQuery.rows[0]?.rank || null,
      profile_score: parseInt(profileScoreQuery.rows[0].total_score, 10)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
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
    score
  } = req.body;
  await db.query(
    `INSERT INTO geoguessr_schema.results 
     (user_id, guessed_lat, guessed_lng, actual_lat, actual_lng, guessed_floor, actual_floor, distance_meters, score) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      req.userId,
      guessed_lat,
      guessed_lng,
      actual_lat,
      actual_lng,
      guessed_floor,
      actual_floor,
      distance_meters,
      score
    ]
  );
  res.json({ success: true });
});

// Get leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
          u.name,
          u.email,
          u.city,
          u.country,
          COUNT(r.id) AS total_attempts,
          SUM(CASE WHEN r.distance_meters < 10 THEN 1 ELSE 0 END) AS successful_attempts,
          ROUND(AVG(r.distance_meters)::numeric, 2) AS avg_distance,
          SUM(r.score) AS score
      FROM geoguessr_schema.users u
      LEFT JOIN geoguessr_schema.results r 
          ON u.id = r.user_id
      GROUP BY u.id, u.name, u.city, u.country
      ORDER BY score DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
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
