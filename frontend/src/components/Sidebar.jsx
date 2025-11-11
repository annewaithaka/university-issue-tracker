import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ user, isOpen, setIsOpen }) => {
  const location = useLocation();
  const role = user?.role || "";

  const linksByRole = {
    admin: [
      { name: "Dashboard", path: "/admin" },
      { name: "Users", path: "/admin#users" },
      { name: "Incharges", path: "/admin#incharges" },
      { name: "Issues", path: "/admin#issues" },
    ],
    incharge: [
      { name: "Dashboard", path: "/incharge" },
      { name: "Assigned Issues", path: "/incharge#assigned" },
    ],
    user: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "My Issues", path: "/dashboard#my-issues" },
    ],
  };

  const navLinks = linksByRole[role] || [];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-blue-700 text-white shadow-xl transform transition-transform duration-300 z-50
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        {/* Header section (only visible on mobile) */}
        <div className="flex items-center justify-between p-4 border-b border-blue-500 md:hidden">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white text-xl hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Nav Links */}
        <div className="p-6 md:p-4 flex flex-col space-y-3">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.path.split("#")[0] &&
              location.hash === (link.path.includes("#") ? `#${link.path.split("#")[1]}` : "");

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded font-medium transition ${
                  isActive
                    ? "bg-white text-blue-700"
                    : "text-white hover:bg-blue-600"
                }`}
                onClick={() => setIsOpen(false)} // auto-close sidebar on mobile
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
