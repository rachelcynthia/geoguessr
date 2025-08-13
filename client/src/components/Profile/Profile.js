import { useEffect, useState, useContext } from "react";
import "./Profile.css";

const Profile = () => {
  const [profileData, setProfileData] = useState([]);
  console.log("user context:", profileData);
  const { name, city, country, profile_image, total_attempts, global_rank, country_rank, successful_attempts, failed_attempts, profile_score } = profileData || {};


  useEffect(() => {
  fetch(`${process.env.REACT_APP_SERVER_URL}/api/profile`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.json())
    .then(data => setProfileData(data))
    .catch(err => console.error(err));
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
          <div>{profile_score || "N/A"}</div>
          <div>Score</div>
        </div>
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