import { useEffect, useState } from "react";
import "./Leaderboard.css";

const Leaderboard = () => {
  const [entries, setEntries] = useState([]);
  const [userId, setUserId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "avg_distance", direction: "asc" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

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

  const sortedEntries = [...entries].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Compute national ranks
  // Map of country -> array of entries sorted by avg_distance ascending
  const entriesByCountry = {};
  sortedEntries.forEach(entry => {
    if (!entriesByCountry[entry.country]) entriesByCountry[entry.country] = [];
    entriesByCountry[entry.country].push(entry);
  });

  // For each entry, get national rank = index in that country's list +1
  const nationalRanks = {};
  for (const country in entriesByCountry) {
    entriesByCountry[country].forEach((entry, idx) => {
      nationalRanks[entry.name + entry.city + entry.country] = idx + 1;
    });
  }

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>

      <table>
        <thead>
          <tr>
            <th># <button onClick={() => handleSort("avg_distance")}>⬍</button></th>
            <th>Name<button onClick={() => handleSort("name")}>⬍</button></th>
            <th>Location (City, Country)</th>
            <th>Global Rank</th>
            <th>National Rank</th>
            <th>
              Avg Distance <button onClick={() => handleSort("avg_distance")}>⬍</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry, idx) => {
            const isCurrentUser = entry.user_id === userId;
            const natRankKey = entry.name + entry.city + entry.country;
            return (
              <tr
                key={entry.user_id ?? idx}
                style={{
                  fontWeight: isCurrentUser ? "bold" : "normal",
                  color: isCurrentUser ? "green" : "black"
                }}
              >
                <td>#{idx + 1}</td>
                <td>{entry.name}</td>
                <td>{`${entry.city}, ${entry.country}`}</td>
                <td>{idx + 1}</td> {/* Global Rank */}
                <td>{nationalRanks[natRankKey]}</td> {/* National Rank */}
                <td>{Math.round(entry.avg_distance)}m</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
