// frontend/src/components/Navbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const localLogout = async () => {
    try {
      await api.post("/auth/logout"); // -> /api/auth/logout
    } catch (err) {
      console.error("logout error", err);
    } finally {
      // always redirect to login
      navigate("/login");
    }
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
      <h1 className="text-lg font-semibold cursor-pointer" onClick={() => navigate(user?.role === "admin" ? "/admin" : "/dashboard")}>
        🎓 University Issue Tracker
      </h1>

      <div className="flex items-center gap-4">
        {user && <span>{user.name} ({user.role})</span>}
        <button
          onClick={onLogout ? onLogout : localLogout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
