import { useEffect, useState } from "react";

export default function Leaderboard({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch current user ID
    fetch("http://localhost:3001/api/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUserId(data.id))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/leaderboard")
      .then(res => res.json())
      .then(setEntries)
      .catch(console.error);
  }, []);

  return (
    <div className="leaderboard">
      <button onClick={onClose}>Close Leaderboard</button>
      <h2>🏆 Leaderboard</h2>
      <ul>
        {entries.map((entry, idx) => (
          <li
            key={entry.user_id}
            style={{
              fontWeight: entry.user_id === userId ? "bold" : "normal",
              color: entry.user_id === userId ? "green" : "black"
            }}
          >
            #{idx + 1} - User {entry.user_id} - Avg Distance: {Math.round(entry.avg_distance)}m
          </li>
        ))}
      </ul>
    </div>
  );
}
