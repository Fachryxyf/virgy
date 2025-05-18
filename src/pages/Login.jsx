import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Simulasi login
    if (email === "user@mandom.com" && password === "admin") {
      localStorage.setItem("isLoggedIn", "true");
      navigate("/home");
    } else {
      setError("Email atau password salah");
    }

    // Persiapan untuk API:
    /*
    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Email atau password salah");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("isLoggedIn", "true");
      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
    */
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Selamat Datang di Website SPK</h2>
        <p className="login-subtitle">PT. Mandom Indonesia Tbk</p>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
