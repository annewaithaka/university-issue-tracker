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
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role: "user",
    department: "",
    year: "",
  });

  // Success popup
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Modal & comments state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [issueComments, setIssueComments] = useState([]);

  // Fetch data
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

  const fetchIssueDetails = async (issueId) => {
    try {
      const res = await api.get(`/issues/${issueId}/comments`);
      setIssueComments(res.data);
    } catch (err) {
      console.error("Error loading issue comments:", err);
      setIssueComments([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchIncharges();
    fetchIssues();
  }, []);

  // === Issue actions ===
  const handleViewIssue = async (issue) => {
    setSelectedIssue(issue);
    setModalOpen(true);
    fetchIssueDetails(issue.id);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/issues/${selectedIssue.id}/comment`, { comment: commentText });
      setCommentText("");
      fetchIssueDetails(selectedIssue.id);
      showSuccess("Comment added!");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleAssignIncharge = async (issueId, inchargeId) => {
    if (!inchargeId) return;
    try {
      await api.put(`/issues/${issueId}/assign`, { incharge_id: inchargeId });
      fetchIssues();
      fetchIssueDetails(issueId);
      showSuccess("Incharge assigned!");
    } catch (err) {
      console.error("Error assigning incharge:", err);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      await api.put(`/issues/${issueId}`, { status: newStatus });
      fetchIssues();
      fetchIssueDetails(issueId);
      showSuccess("Status updated!");
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm("Delete this issue?")) return;
    try {
      await api.delete(`/issues/${issueId}`);
      fetchIssues();
      if (selectedIssue?.id === issueId) setModalOpen(false);
      showSuccess("Issue deleted successfully!");
    } catch (err) {
      console.error("Error deleting issue:", err);
    }
  };

  // === User / Incharge form handling ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/admin/users/${formData.id}`, formData);
        showSuccess(`${formData.role} updated!`);
      } else {
        await api.post("/admin/users", formData);
        showSuccess(`${formData.role} created!`);
      }

      setFormData({
        id: null,
        name: "",
        email: "",
        password: "",
        role: activeTab === "users" ? "user" : "incharge",
        department: "",
        year: "",
      });

      if (activeTab === "users") fetchUsers();
      else if (activeTab === "incharges") fetchIncharges();
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id: item.id,
      name: item.name,
      email: item.email,
      password: "",
      role: item.role,
      department: item.department || "",
      year: item.year || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      if (activeTab === "users") fetchUsers();
      else if (activeTab === "incharges") fetchIncharges();
      showSuccess("Deleted successfully!");
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  // === Render ===
  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      {successMessage && <div className="success-popup">{successMessage}</div>}

      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b pb-2">
          {["issues", "users", "incharges"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-md ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
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
                        <td className="p-2 border">{issue.reporter?.name || "—"}</td>
                        <td className="p-2 border">{issue.incharge?.name || "—"}</td>
                        <td className="p-2 border">{issue.status}</td>
                        <td className="p-2 border">{issue.created_at}</td>
                        <td className="p-2 border flex space-x-2">
                          <button
                            onClick={() => handleViewIssue(issue)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            View Details
                          </button>
                          
                          <button
                            onClick={() => handleDeleteIssue(issue.id)}
                            disabled={issue.status !== "Completed"}
                            className={`px-3 py-1 rounded ${issue.status === "Completed"
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none"
                              }`}
                          >
                            Delete
                          </button>
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

            {/* --- Issue Modal --- */}
            {modalOpen && selectedIssue && (
              <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="modal-content bg-white p-6 rounded w-1/2 max-h-[80vh] overflow-auto relative">
                  <button
                    className="close-btn absolute top-2 right-2 text-gray-700 font-bold"
                    onClick={() => setModalOpen(false)}
                  >
                    &times;
                  </button>

                  <h2 className="text-xl font-semibold mb-2">{selectedIssue.title}</h2>
                  <p><strong>Description:</strong> {selectedIssue.description}</p>
                  <p><strong>Category:</strong> {selectedIssue.category}</p>
                  <p>
                    <strong>Reporter:</strong>{" "}
                    {selectedIssue.reporter?.name || "—"} ({selectedIssue.reporter?.email || "—"})
                  </p>

                  <p>
                    <strong>Incharge:</strong>{" "}
                    <select
                      value={selectedIssue.incharge?.id || ""}
                      onChange={(e) =>
                        handleAssignIncharge(selectedIssue.id, e.target.value)
                      }
                      className="border p-1 rounded"
                    >
                      <option value="">Assign Incharge</option>
                      {incharges.map((inc) => (
                        <option key={inc.id} value={inc.id}>
                          {inc.name}
                        </option>
                      ))}
                    </select>
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <select
                      value={selectedIssue.status}
                      onChange={(e) =>
                        handleUpdateStatus(selectedIssue.id, e.target.value)
                      }
                      className="border p-1 rounded"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </p>

                  <h3 className="mt-4 mb-2 font-semibold">Comments</h3>
                  <div className="comments-list max-h-40 overflow-y-auto mb-2 border-t border-gray-300 pt-2">
                    {issueComments.length === 0 ? (
                      <p className="text-gray-500">No comments yet.</p>
                    ) : (
                      issueComments.map((c) => (
                        <div key={c.id} className="mb-1">
                          <strong>{c.author} ({c.author_role})</strong>: {c.comment_text}{" "}
                          <em>({c.created_at})</em>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <textarea
                      className="border p-2 flex-1 rounded"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                      onClick={handleAddComment}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === USERS TAB === */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Manage Users</h2>

            {/* Users Form (Role locked to 'user') */}
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
              <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="border p-2 rounded" required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="border p-2 rounded" required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="border p-2 rounded" required={!formData.id} />
              <select name="role" value="user" readOnly className="border p-2 rounded">
                <option value="user">User</option>
              </select>
              <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} className="border p-2 rounded" />
              <input type="text" name="year" placeholder="Year" value={formData.year} onChange={handleChange} className="border p-2 rounded" />

              <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
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
                      <button onClick={() => handleEdit(u)} className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500">Edit</button>
                      <button onClick={() => handleDelete(u.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
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
            <h2 className="text-lg font-semibold mb-4">Manage Incharges / Admins</h2>

            {/* Form to add/edit incharge/admin */}
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
              <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="border p-2 rounded" required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="border p-2 rounded" required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="border p-2 rounded" required={!formData.id} />
              <select name="role" value={formData.role} onChange={handleChange} className="border p-2 rounded">
                <option value="incharge">Incharge</option>
                <option value="admin">Admin</option>
              </select>
              <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} className="border p-2 rounded" />

              <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                {formData.id ? "Update" : "Add"} Incharge/Admin
              </button>
            </form>

            {/* Incharges/Admins Table */}
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Department</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incharges.length > 0 ? (
                  incharges.map((i) => (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{i.id}</td>
                      <td className="p-2 border">{i.name}</td>
                      <td className="p-2 border">{i.email}</td>
                      <td className="p-2 border">{i.role}</td>
                      <td className="p-2 border">{i.department}</td>
                      <td className="p-2 border space-x-2">
                        <button onClick={() => handleEdit(i)} className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500">Edit</button>
                        <button onClick={() => handleDelete(i.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-3 text-center text-gray-500">
                      No incharges or admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
