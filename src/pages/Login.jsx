import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api"; 
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Ubah fungsi ini menjadi async untuk menangani panggilan API
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Kirim request POST ke endpoint '/auth/login' di backend
      //    URL lengkapnya menjadi 'http://localhost:8080/api/auth/login'
      //    karena baseURL sudah diatur di api.js
      const response = await api.post('/auth/login', {
        email: email,
        password: password,
      });

      // 2. Jika request berhasil (status 200 OK)
      if (response.data && response.data.token) {
        // 3. Simpan token yang diterima dari backend ke localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("isLoggedIn", "true"); // Ini bisa tetap dipakai untuk UI check
        
        // 4. Arahkan pengguna ke halaman home
        navigate("/home");
      }
    } catch (err) {
      // 5. Jika terjadi error (misal: password salah atau server mati)
      setError("Email atau password salah. Silakan coba lagi.");
      console.error("Login failed:", err);
    }
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