const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("./db");
const crypto = require('crypto');

const { authMiddleware, requireNonGuest } = require("./authMiddleware");
const { log } = require("console");
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

    const values = [email, hash, name, city, country, profile_image];
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
app.get("/api/profile", authMiddleware, requireNonGuest, async (req, res) => {
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

app.get("/api/score", authMiddleware, (req, res) => {
  const userId = req.userId;
  db.query(
    `SELECT COALESCE(SUM(score), 0) AS total_score
       FROM geoguessr_schema.results
       WHERE user_id = $1`,
    [userId]
  ).then(result => {
    const totalScore = result.rows[0].total_score || 0;
    res.json({ totalScore });
  }).catch(err => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  });
});

app.post("/api/guest", async (_req, res) => {
  const jti = crypto.randomUUID();
  const payload = { sub: `guest_${jti}`, role: 'guest', jti };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

  res.json({ token, user: { id: payload.sub, role: 'guest', name: 'Guest' } });

});

// Submit game result
app.post("/api/submit", authMiddleware, async (req, res) => {
  const {
    guessed_lat, guessed_lng, actual_lat, actual_lng,
    guessed_floor, actual_floor, distance_meters, score, difficulty
  } = req.body;

  // Opportunistic global cleanup (cheap if indexed)
  await db.query(`DELETE FROM geoguessr_schema.guest_results WHERE expires_at <= now()`);

  if (req.user?.role === 'guest') {
    console.log("Guest submission", req.user);
    const expiresAt = new Date((req.user.exp || 0) * 1000); // exp in seconds
    if (!req.user.jti || !req.user.exp) {
      return res.status(400).json({ error: 'Invalid guest token' });
    }

    await db.query(
      `INSERT INTO geoguessr_schema.guest_results
       (guest_id, expires_at, guessed_lat, guessed_lng, actual_lat, actual_lng,
        guessed_floor, actual_floor, distance_meters, score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        req.user.jti, expiresAt,
        guessed_lat, guessed_lng, actual_lat, actual_lng,
        guessed_floor, actual_floor, distance_meters, score
      ]
    );

    return res.json({ success: true, ephemeral: true });
  }

  // Registered users: original persistent table
  await db.query(
    `INSERT INTO geoguessr_schema.results
     (user_id, guessed_lat, guessed_lng, actual_lat, actual_lng, guessed_floor, actual_floor, distance_meters, score, difficulty)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10)`,
    [
      req.userId,
      guessed_lat, guessed_lng, actual_lat, actual_lng,
      guessed_floor, actual_floor, distance_meters, score, difficulty
    ]
  );

  res.json({ success: true });
});

app.get("/api/guest-scores", authMiddleware, async (req, res) => {
   if (req.user?.role !== 'guest') {
    return res.status(400).json({ error: 'Not a guest session' });
  }

  // Opportunistic cleanup
  await db.query(`DELETE FROM geoguessr_schema.guest_results WHERE expires_at <= now()`);

  db.query(
    `SELECT COALESCE(SUM(score), 0) AS total_score
       FROM geoguessr_schema.guest_results
       WHERE guest_id = $1 AND expires_at > now()`,
    [req.user.jti]
  ).then(result => {
    const totalScore = result.rows[0].total_score || 0;
    res.json({ totalScore });
  }).catch(err => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  })
});



// Get leaderboard
app.get("/api/leaderboard", async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT 
          u.name,
          u.city,
          u.country,
          COUNT(r.id) AS total_attempts,
          SUM(r.score) AS total_score,
          ROUND(AVG(r.score)::numeric, 2) AS avg_score
      FROM geoguessr_schema.users u
      LEFT JOIN geoguessr_schema.results r 
          ON u.id = r.user_id
      GROUP BY u.id, u.name, u.city, u.country
      ORDER BY total_score DESC
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
