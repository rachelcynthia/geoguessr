import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

export default function Register() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // ⬅️ for navigation

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/api/register", {
        email,
        password,
      });
      login(res.data.token); 
      navigate("/"); 
    } catch (err) {
      alert("Registration failed: " + err.response?.data?.error);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        required
      />
      <button type="submit">Register</button>

      {/* Login button/link */}
      <p>
        Already have an account?{" "}
        <Link to="/login">
          <button type="button">Login</button>
        </Link>
      </p>
    </form>
  );
}
