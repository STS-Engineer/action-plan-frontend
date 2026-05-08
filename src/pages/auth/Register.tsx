import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { registerUser } from "../../services/authService";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await registerUser(email, password);

      setSuccess("Account created successfully. You can now sign in.");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleRegister}>
        <h1>Create account</h1>
        <p>Only AVOCarbon directory emails are allowed</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

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
          placeholder="Choose a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <span className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </span>
      </form>
    </div>
  );
}