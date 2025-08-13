import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import './Register.css';

const Register = () => {
  const { login } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("/assets/avatars/avatar1.png"); // default avatar

  const navigate = useNavigate();

  const avatars = [
    "/assets/avatars/avatar1.jpg",
    "/assets/avatars/avatar2.jpg",
    "/assets/avatars/avatar3.jpg",
    "/assets/avatars/avatar4.jpg",
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/register`, {
        email,
        password,
        name,
        city,
        country,
        avatar: selectedAvatar,
      });
      login(res.data.token);
      navigate("/");
    } catch (err) {
      alert("Registration failed: " + err.response?.data?.error);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleRegister} className="register-form">
        <div className="register-title">Register</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          className="register-input"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          required
          className="register-input"
        />
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country"
          required
          className="register-input"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="register-input"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
          className="register-input"
        />

        {/* Avatar picker */}
        <div className="avatar-picker">
          <label>Select an Avatar </label>
          <div className="avatar-list">
            {avatars.map((avatar, idx) => (
              <img
                key={idx}
                src={avatar}
                alt={`Avatar ${idx + 1}`}
                className={`avatar-image ${selectedAvatar === avatar ? "selected" : ""}`}
                onClick={() => setSelectedAvatar(avatar)}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="register-button">Register</button>

        <div className="login">
          Already have an account?{" "}
          <Link to="/login" className="login-link">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
