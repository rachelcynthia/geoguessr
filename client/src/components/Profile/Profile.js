import { useEffect, useState, useContext } from "react";
import UserContext from "../../context/UserContext";
import "./Profile.css";

const Profile = () => {
  const [results, setResults] = useState([]);
  const [user] = useContext(UserContext);
  console.log("user context:", user);
  const { name, city, country, profile_image, total_attempts, global_rank, country_rank, successful_attempts, failed_attempts } = user || {};

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:3001/api/my-results", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setResults)
      .catch(console.error);
  }, []);

  const alt_image = profile_image || "/assets/avatars/avatar1.jpg"; // default avatar if none provided

  return (
    <div className="profile-container">
      <div className="profile-picture">
        <img src={alt_image} alt="Profile" />
      </div>
      <div className="profile-name">{name}</div>
      <div className="profile-location">{city}, {country}</div>
      <div className="profile-stats">
        <div className="profile-stat">
          <div>{global_rank || "N/A"}</div>
          <div>Global Rank</div>
        </div>
        <div className="profile-stat">
          <div>{country_rank || "N/A"}</div>
          <div>National Rank</div>
        </div>
      </div>
      <div className="profile-stats">
        <div className="profile-stat">
          <div>{total_attempts || 0}</div>
          <div>Total Attempts</div>
        </div>

       <div className="profile-stat">
          <div>{successful_attempts || 0}</div>
          <div>Successful Attempts</div>
        </div>
         <div className="profile-stat">
          <div>{failed_attempts || 0}</div>
          <div>Failed Attempts</div>
        </div>
      </div>
    </div>
  );
}

export default Profile;