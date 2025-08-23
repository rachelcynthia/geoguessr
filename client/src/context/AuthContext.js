// context/AuthContext.jsx
import { createContext, useState, useMemo } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const login = (jwt, meta = {}) => {
    setToken(jwt);
    setUser(meta);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(meta));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const isGuest = user?.role === "guest";

  const value = useMemo(
    () => ({ token, user, isGuest, login, logout }),
    [token, user, isGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
