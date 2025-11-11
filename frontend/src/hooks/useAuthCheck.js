// frontend/src/hooks/useAuthCheck.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function useAuthCheck() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get("/auth/check");
        if (res.data.authenticated) {
          const userData = res.data.user;
          setUser(userData);

          // 🔹 Automatically redirect based on role
          if (window.location.pathname === "/login" || window.location.pathname === "/") {
            if (userData.role === "admin") navigate("/admin");
            else if (userData.role === "incharge") navigate("/incharge");
            else navigate("/dashboard");
          }
        } else {
          // not authenticated
          if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
            navigate("/login");
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  return { user, loading, setUser };
}
