import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axiosConfig";

const UserDashboard = ({ user, onLogout }) => {
  const [issues, setIssues] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: user?.department || "",
  });
  const [loading, setLoading] = useState(true);

  // ✅ Fetch issues submitted by this user
  const fetchMyIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user/issues");
      setIssues(res.data || []);
    } catch (err) {
      console.error("Error fetching user issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyIssues();
  }, []);

  // ✅ Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Submit new issue
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert("Please fill all required fields");
      return;
    }
    try {
      await api.post("/issues", formData);
      setFormData({ title: "", description: "", department: user?.department || "" });
      fetchMyIssues();
    } catch (err) {
      console.error("Error submitting issue:", err);
      alert("Failed to submit issue");
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-6">My Issues</h1>

        {/* === New Issue Form === */}
        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-3 gap-4 mb-8 border-b pb-6"
        >
          <input
            type="text"
            name="title"
            placeholder="Issue Title"
            value={formData.title}
            onChange={handleChange}
            className="border p-2 rounded col-span-1"
            required
          />
          <input
            type="text"
            name="department"
            placeholder="Department"
            value={formData.department}
            onChange={handleChange}
            className="border p-2 rounded col-span-1"
          />
          <textarea
            name="description"
            placeholder="Describe the issue..."
            value={formData.description}
            onChange={handleChange}
            className="border p-2 rounded col-span-3 h-24"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 col-span-3"
          >
            Submit Issue
          </button>
        </form>

        {/* === My Issues Table === */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-6 text-gray-500">Loading...</div>
          ) : issues.length === 0 ? (
            <p className="text-center text-gray-500 italic py-6">
              No issues submitted yet.
            </p>
          ) : (
            <table className="min-w-full bg-white border text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Title</th>
                  <th className="p-2 border">Department</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Assigned To</th>
                  <th className="p-2 border">Submitted On</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{i.id}</td>
                    <td className="p-2 border">{i.title}</td>
                    <td className="p-2 border">{i.department}</td>
                    <td
                      className={`p-2 border font-medium ${
                        i.status === "resolved"
                          ? "text-green-600"
                          : i.status === "in_progress"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {i.status}
                    </td>
                    <td className="p-2 border">{i.incharge_name || "Unassigned"}</td>
                    <td className="p-2 border">
                      {new Date(i.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
