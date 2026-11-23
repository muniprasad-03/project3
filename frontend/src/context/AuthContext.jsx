import { createContext, useContext, useEffect, useState } from "react";
import api, { setAccessToken } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .post("/auth/refresh")
      .then((r) => {
        setAccessToken(r.data.accessToken);
        setUser(r.data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    setAccessToken(r.data.accessToken);
    setUser(r.data.user);
    return r.data.user;
  };
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
