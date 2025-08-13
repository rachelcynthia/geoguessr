import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
    }
  }, [token]);


  const login = (newToken) => setToken(newToken);
  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setEmail("");
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
