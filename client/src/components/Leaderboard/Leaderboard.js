import { useEffect, useState } from "react";
import "./Leaderboard.css";

const Leaderboard = () => {
  const [entries, setEntries] = useState([]);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_SERVER_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(setEntries)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setEmail(localStorage.getItem("email"));
    }
  }, []);

  // Sort by score descending (highest score = rank 1)
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Global Rank</th>
            <th>Name</th>
            <th>Location (City, Country)</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry, idx) => {
            const isCurrentUser = entry.email === email;
            return (
              <tr
                key={entry.user_id ?? idx}
                style={{
                  fontWeight: isCurrentUser ? "bold" : "normal",
                  color: isCurrentUser ? "green" : "black"
                }}
              >
                <td>{idx + 1}</td> {/* Global Rank */}
                <td>{entry.name}</td>
                <td>{`${entry.city}, ${entry.country}`}</td>
                <td>{entry.total_score || 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
