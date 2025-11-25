// frontend/src/layouts/DashboardLayout.jsx
import React from "react";
import Navbar from "../components/Navbar";

const DashboardLayout = ({ children, user, onLogout }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={onLogout} />
      <main className="p-6 flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default DashboardLayout;
