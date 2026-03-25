import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_SESSION_KEY, verifyAdminPassword } from "../utils/adminAuth";
import "./AdminDashboard.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await verifyAdminPassword(password);
      if (ok) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, password);
        navigate("/admin", { replace: true });
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h1>Admin Dashboard</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-pwd">Password</label>
          <input
            id="admin-pwd"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            disabled={loading}
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" disabled={loading || !password}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
