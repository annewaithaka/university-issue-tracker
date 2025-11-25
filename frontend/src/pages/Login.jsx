import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "../styles/Login.css";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      const loggedInUser = res.data?.user;

      if (!loggedInUser) {
        setError("Unexpected server response. Please try again.");
        return;
      }

      setUser(loggedInUser);

      if (loggedInUser.role === "admin") navigate("/admin");
      else if (loggedInUser.role === "incharge") navigate("/incharge");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">KCA ISSUE TICKETING SYSTEM</h1>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
