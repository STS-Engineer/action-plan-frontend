import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { loginUser } from "../../services/authService";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await loginUser(email, password);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <h1>Welcome back</h1>
        <p>Sign in to access Action Plan Management</p>

        {error && <div className="auth-error">{error}</div>}

        <label>Email</label>
        <input
          type="email"
          placeholder="name@avocarbon.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <span className="auth-link">
          No account yet? <Link to="/register">Create one</Link>
        </span>
      </form>
    </div>
  );
}