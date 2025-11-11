import React from "react";
import api from "../api/axiosConfig";
import "../styles/IssueCard.css";

const IssueCard = ({ issue, currentUser, onUpdate, onDelete }) => {
  const isAdmin = currentUser?.role === "admin";
  const isIncharge = currentUser?.role === "incharge";
  const isOwner = currentUser?.id === issue.reported_by_id;

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.put(`/issues/${issue.id}`, { status: newStatus });
      onUpdate && onUpdate(res.data);
    } catch (err) {
      console.error("Failed to update issue:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      await api.delete(`/issues/${issue.id}`);
      onDelete && onDelete(issue.id);
    } catch (err) {
      console.error("Failed to delete issue:", err);
    }
  };

  const handleAssign = async () => {
    const inchargeEmail = prompt("Enter incharge email to assign:");
    if (!inchargeEmail) return;
    try {
      const res = await api.put(`/issues/${issue.id}/assign`, { incharge_email: inchargeEmail });
      onUpdate && onUpdate(res.data);
    } catch (err) {
      console.error("Failed to assign issue:", err);
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString() : "—";

  return (
    <div className={`issue-card ${issue.status.toLowerCase()}`}>
      <div className="issue-header">
        <h3>{issue.title}</h3>
        <span className={`status-badge ${issue.status.toLowerCase()}`}>
          {issue.status}
        </span>
      </div>

      <p className="issue-description">{issue.description}</p>
      <p><strong>Category:</strong> {issue.category}</p>
      <p><strong>Reported by:</strong> {issue.reported_by?.email || "Unknown"}</p>
      <p><strong>Assigned to:</strong> {issue.assigned_to?.email || "Unassigned"}</p>

      <div className="issue-dates">
        <small>🕒 Created: {formatDate(issue.created_at)}</small><br />
        {issue.completed_at && (
          <small>✅ Completed: {formatDate(issue.completed_at)}</small>
        )}
      </div>

      <div className="issue-actions">
        {isAdmin && (
          <>
            <button className="btn-assign" onClick={handleAssign}>Assign Incharge</button>
            <button className="btn-delete" onClick={handleDelete}>Delete</button>
          </>
        )}

        {isIncharge && (
          <>
            <button
              className="btn-progress"
              onClick={() => handleStatusChange("In Progress")}
              disabled={issue.status === "In Progress"}
            >
              Mark In Progress
            </button>
            <button
              className="btn-complete"
              onClick={() => handleStatusChange("Completed")}
              disabled={issue.status === "Completed"}
            >
              Mark Complete
            </button>
          </>
        )}

        {isOwner && !isAdmin && (
          <>
            <button className="btn-edit">Edit</button>
            <button className="btn-delete" onClick={handleDelete}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
};

export default IssueCard;
