// frontend/src/components/Navbar.jsx
import React from "react";

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-white tracking-wide">
          KCA ISSUE TICKETING SYSTEM
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-white text-sm text-right">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-xs capitalize">{user?.role}</p>
        </div>

        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium shadow transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
