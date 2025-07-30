import { useEffect, useState } from "react";
import "./Profile.css";

export default function ProfilePage({ onClose }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(token);
    
    fetch("http://localhost:3001/api/my-results", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setResults)
      .catch(console.error);
  }, []);

  return (
    <div className="profile-page">
      <button onClick={onClose} className="close-btn">✖</button>
      <h2>Your Past Attempts</h2>
      <ul>
        {results.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          results.map((r, i) => (
            <li key={i}>
              Distance: {r.distance_meters.toFixed(2)} m, Guessed Floor: {r.guessed_floor}, Actual Floor: {r.actual_floor}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
