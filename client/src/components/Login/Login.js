import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/login`, { email, password });
      login(res.data.token);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  // --- Option A: Proper guest login (backend issues a real JWT)
  const handleGuestLogin = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/guest`);
      // expects: { token, user: { id, name, role: 'guest' } }
      login(res.data.token, res.data.user);
      navigate("/game");
    } catch (err) {
      alert(err.response?.data?.error || "Guest login failed");
    }
  };

  // --- Option B: Quick client-only fallback (no backend change yet)
  // const handleGuestLogin = () => {
  //   login("guest", { id: null, name: "Guest", role: "guest" });
  //   navigate("/game");
  // };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <div className="guest-button" onClick={handleGuestLogin}>
          Play as Guest
        </div>

        <div className="login-sep">OR</div>

        <div className="login-title">Login</div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email"
          className="login-input"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          placeholder="Password"
          className="login-input"
        />
        <button type="submit" className="login-button">Login</button>

        <div className="register">
          Don't have an account?
          <Link to="/register" className="register-link">Register</Link>
        </div>
      </form>
    </div>
  );
}
