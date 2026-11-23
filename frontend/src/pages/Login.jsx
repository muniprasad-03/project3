import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await login(email.trim(), password);
      navigate(`/${u.role}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to login");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand" style={{ color: "#172033" }}>
          Campus LMS
        </div>
        <p className="muted">Sign in to your learning workspace</p>
        <label>Email address</label>
        <input
          className="field"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@college.edu"
        />
        <label>Password</label>
        <input
          className="field"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
        {error && <p style={{ color: "#c0392b" }}>{error}</p>}
        <button className="btn" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>
          Accounts are created by your LMS administrator.
        </p>
      </form>
    </div>
  );
}
