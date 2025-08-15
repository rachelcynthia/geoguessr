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

  // Group entries by country and compute national ranks
  const entriesByCountry = {};
  entries.forEach(entry => {
    if (!entriesByCountry[entry.country]) entriesByCountry[entry.country] = [];
    entriesByCountry[entry.country].push(entry);
  });

  const nationalRanks = {};
  for (const country in entriesByCountry) {
    // Sort by score descending (higher score = better rank)
    entriesByCountry[country].sort((a, b) => b.score - a.score);
    entriesByCountry[country].forEach((entry, idx) => {
      nationalRanks[entry.name + entry.city + entry.country] = idx + 1;
    });
  }

  // Flatten all entries and sort by national rank
  const sortedEntries = entries
    .map(entry => ({
      ...entry,
      nationalRank: nationalRanks[entry.name + entry.city + entry.country]
    }))
    .sort((a, b) => a.nationalRank - b.nationalRank);

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>National Rank</th>
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
                <td>{entry.nationalRank}</td>
                <td>{entry.name}</td>
                <td>{`${entry.city}, ${entry.country}`}</td>
                <td>{entry.score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
