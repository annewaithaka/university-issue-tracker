import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axiosConfig";

const InchargeDashboard = ({ user, onLogout }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch issues assigned to the incharge
  const fetchAssignedIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get("/incharge/issues"); // Adjust endpoint if needed
      setIssues(res.data || []);
    } catch (err) {
      console.error("Error fetching incharge issues:", err);
      setError("Failed to load assigned issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedIssues();
  }, []);

  // ✅ Update status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/issues/${id}`, { status: newStatus });
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === id ? { ...issue, status: newStatus } : issue
        )
      );
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Could not update issue status.");
    }
  };

  if (loading)
    return (
      <DashboardLayout user={user} onLogout={onLogout}>
        <div className="text-center text-gray-600 py-8">Loading assigned issues…</div>
      </DashboardLayout>
    );

  if (error)
    return (
      <DashboardLayout user={user} onLogout={onLogout}>
        <div className="text-center text-red-600 py-8">{error}</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Assigned Issues
      </h2>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Reported By</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">{issue.id}</td>
                <td className="px-4 py-3">{issue.title}</td>
                <td className="px-4 py-3">{issue.reported_by || "N/A"}</td>
                <td className="px-4 py-3">{issue.department || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={issue.status}
                    onChange={(e) =>
                      handleStatusChange(issue.id, e.target.value)
                    }
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      alert(`Viewing details for issue #${issue.id}`)
                    }
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="text-center text-gray-500 py-6 italic"
                >
                  No issues assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default InchargeDashboard;
