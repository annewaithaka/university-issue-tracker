import React, { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [incharges, setIncharges] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch issues and incharges
  const fetchIssues = async () => {
    try {
      const res = await api.get("/api/issues");
      setIssues(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const fetchIncharges = async () => {
    try {
      const res = await api.get("/api/incharge/");
      setIncharges(res.data);
    } catch (err) {
      console.error("Failed to fetch incharges");
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchIncharges();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/issues/${id}`, { status: newStatus });
      fetchIssues();
      setSelectedIssue(null);
    } catch (err) {
      alert("❌ Failed to update status");
    }
  };

  const deleteIssue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      await api.delete(`/api/issues/${id}`);
      fetchIssues();
      setSelectedIssue(null);
    } catch (err) {
      alert("❌ Failed to delete issue");
    }
  };

  const assignIncharge = async (id, inchargeId) => {
    try {
      await api.put(`/api/issues/${id}`, { incharge_id: inchargeId });
      alert("✅ Incharge assigned successfully");
      fetchIssues();
      setSelectedIssue(null);
    } catch (err) {
      alert("❌ Failed to assign incharge");
    }
  };

  if (loading) return <p className="p-6">Loading issues...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="issue-grid">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="issue-card"
            onClick={() => setSelectedIssue(issue)}
          >
            <h3>{issue.title}</h3>
            <p className="issue-meta">{issue.category}</p>
            <p className="issue-meta">
              Submitted by: {issue.user?.name} ({issue.user?.email})
            </p>
            <p className="issue-meta">Date: {issue.created_at}</p>
            <span
              className={`issue-status ${
                issue.status === "Pending"
                  ? "status-pending"
                  : issue.status === "Resolved"
                  ? "status-resolved"
                  : ""
              }`}
            >
              {issue.status}
            </span>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedIssue && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedIssue.title}</h2>
            <p>{selectedIssue.description}</p>
            <p>
              <strong>Category:</strong> {selectedIssue.category}
            </p>
            <p>
              <strong>Submitted by:</strong>{" "}
              {selectedIssue.user?.name} ({selectedIssue.user?.email})
            </p>
            <p>
              <strong>Date:</strong> {selectedIssue.created_at}
            </p>

            <div className="modal-actions">
              <label>Status:</label>
              <select
                defaultValue={selectedIssue.status}
                onChange={(e) =>
                  updateStatus(selectedIssue.id, e.target.value)
                }
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="modal-actions">
              <label>Assign Incharge:</label>
              <select
                onChange={(e) =>
                  assignIncharge(selectedIssue.id, e.target.value)
                }
              >
                <option value="">Select incharge</option>
                {incharges
                  .filter(
                    (inc) =>
                      inc.department === selectedIssue.category ||
                      selectedIssue.category === "Other"
                  )
                  .map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      {inc.name} ({inc.department})
                    </option>
                  ))}
              </select>
            </div>

            <div className="modal-buttons">
              <button
                className="btn btn-danger"
                onClick={() => deleteIssue(selectedIssue.id)}
              >
                Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedIssue(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-footer">
        <p>University Issue Tracker System © 2025</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
