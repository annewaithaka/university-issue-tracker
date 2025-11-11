import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import DashboardLayout from "../layouts/DashboardLayout";
import "../styles/AdminDashboard.css";


const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("issues");
  const [users, setUsers] = useState([]);
  const [incharges, setIncharges] = useState([]);
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role: "user",
    department: "",
    year: "",
  });

  // === Fetch Data ===
  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchIncharges = async () => {
    try {
      const res = await api.get("/admin/incharges");
      setIncharges(res.data);
    } catch (err) {
      console.error("Error fetching incharges:", err);
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await api.get("/admin/issues");
      setIssues(res.data);
    } catch (err) {
      console.error("Error fetching issues:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchIncharges();
    fetchIssues();
  }, []);

  // === Issue actions ===
  const handleAssignIncharge = async (issueId, inchargeId) => {
    if (!inchargeId) return;
    try {
      await api.put(`/issues/${issueId}/assign`, { incharge_id: inchargeId });
      fetchIssues();
    } catch (err) {
      console.error("Error assigning incharge:", err);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    if (!newStatus) return;
    try {
      await api.put(`/issues/${issueId}`, { status: newStatus });
      fetchIssues();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // === User Form Handling ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/admin/users/${formData.id}`, formData);
      } else {
        await api.post("/admin/users", formData);
      }

      // Reset form + reload
      setFormData({
        id: null,
        name: "",
        email: "",
        password: "",
        role: "user",
        department: "",
        year: "",
      });
      fetchUsers();
    } catch (err) {
      console.error("Error saving user:", err);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department,
      year: user.year,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  // === Render ===
  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b pb-2">
          {["issues", "users", "incharges"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-md ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* === ISSUES TAB === */}
        {activeTab === "issues" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Manage Issues</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border p-2 rounded"
                value={statusFilter}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <button
                onClick={fetchIssues}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>

            {/* Issues Table */}
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Title</th>
                  <th className="p-2 border">Reporter</th>
                  <th className="p-2 border">Incharge</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Created</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.length > 0 ? (
                  issues
                    .filter((i) => !statusFilter || i.status === statusFilter)
                    .map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="p-2 border">{issue.id}</td>
                        <td className="p-2 border">{issue.title}</td>
                        <td className="p-2 border">
                          {issue.reporter?.name || "—"}
                        </td>
                        <td className="p-2 border">
                          {issue.incharge?.name || "—"}
                        </td>
                        <td className="p-2 border">{issue.status}</td>
                        <td className="p-2 border">{issue.created_at}</td>
                        <td className="p-2 border space-x-2">
                          {/* Assign dropdown */}
                          <select
                            onChange={(e) =>
                              handleAssignIncharge(issue.id, e.target.value)
                            }
                            className="border p-1 rounded"
                            defaultValue=""
                          >
                            <option value="">Assign Incharge</option>
                            {incharges.map((inc) => (
                              <option key={inc.id} value={inc.id}>
                                {inc.name}
                              </option>
                            ))}
                          </select>

                          {/* Update status */}
                          <select
                            onChange={(e) =>
                              handleUpdateStatus(issue.id, e.target.value)
                            }
                            className="border p-1 rounded"
                            defaultValue=""
                          >
                            <option value="">Update Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-3 text-center text-gray-500">
                      No issues found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* === USERS TAB === */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Manage Users</h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="border p-2 rounded"
                required={!formData.id}
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="user">User</option>
                <option value="incharge">Incharge</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="year"
                placeholder="Year"
                value={formData.year}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <button
                type="submit"
                className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                {formData.id ? "Update" : "Add"} User
              </button>
            </form>

            {/* Users Table */}
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Department</th>
                  <th className="p-2 border">Year</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{u.id}</td>
                    <td className="p-2 border">{u.name}</td>
                    <td className="p-2 border">{u.email}</td>
                    <td className="p-2 border">{u.role}</td>
                    <td className="p-2 border">{u.department}</td>
                    <td className="p-2 border">{u.year}</td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === INCHARGES TAB === */}
        {activeTab === "incharges" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Manage Incharges</h2>
            {incharges.length === 0 ? (
              <p>No incharges found.</p>
            ) : (
              <ul className="list-disc ml-5">
                {incharges.map((i) => (
                  <li key={i.id}>
                    {i.name} – {i.department} ({i.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
