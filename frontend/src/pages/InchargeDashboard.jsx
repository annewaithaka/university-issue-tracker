// src/pages/InchargeDashboard.jsx
import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axiosConfig";

const InchargeDashboard = ({ user, onLogout }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal + comments
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [issueComments, setIssueComments] = useState([]);
  const [busy, setBusy] = useState(false);

  // Fetch issues assigned to the logged-in incharge.
  // IMPORTANT: use /issues GET — backend returns assigned issues for incharge
  const fetchAssignedIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get("/issues"); // <-- correct endpoint
      setIssues(res.data || []);
      setError(null);
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

  // Update status (Incharge can update)
  const handleStatusChange = async (id, newStatus) => {
    if (!newStatus) return;
    try {
      setBusy(true);
      // Send canonical status strings that align with other parts of app
      await api.put(`/issues/${id}`, { status: newStatus });
      // optimistic update
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === id ? { ...issue, status: newStatus } : issue
        )
      );
      // if the modal is open for this issue, refresh details
      if (selectedIssue?.id === id) {
        await loadIssueDetail(id);
      }
      alert("Status updated");
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Could not update issue status.");
    } finally {
      setBusy(false);
    }
  };

  // Load full issue detail (reporter, incharge, comments) using admin detail endpoint
  // admin route allows incharge and admin to view details.
  const loadIssueDetail = async (id) => {
    try {
      setBusy(true);
      const res = await api.get(`/admin/issues/${id}`);
      setSelectedIssue(res.data);
      setIssueComments(res.data.comments || []);
    } catch (err) {
      console.error("Error loading issue detail:", err);
      // fallback: if admin endpoint is unavailable, try minimal comment fetch + find issue
      try {
        const commentsRes = await api.get(`/issues/${id}/comments`);
        setIssueComments(commentsRes.data || []);
      } catch (_) {
        setIssueComments([]);
      }
      // attempt to set selectedIssue using local list
      const local = issues.find((it) => it.id === id);
      if (local) setSelectedIssue(local);
    } finally {
      setBusy(false);
    }
  };

  // Open modal + load details
  const handleViewIssue = async (issue) => {
    setModalOpen(true);
    await loadIssueDetail(issue.id);
  };

  // Add comment
  const handleAddComment = async () => {
    const text = commentText?.trim();
    if (!text) return;
    if (!selectedIssue) return;

    try {
      setBusy(true);
      await api.post(`/issues/${selectedIssue.id}/comment`, { comment: text });
      setCommentText("");
      // refresh comments (and modal detail)
      await loadIssueDetail(selectedIssue.id);
      alert("Comment added");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setBusy(false);
    }
  };

  // Mark Completed shortcut (only allow when currently In Progress)
  const handleMarkCompleted = async (issueId) => {
    const confirm = window.confirm("Mark this issue as Completed?");
    if (!confirm) return;
    await handleStatusChange(issueId, "Completed");
  };

  // Delete issue — in your backend delete requires admin or reporter.
  // Incharge likely cannot delete — so we won't expose delete here.
  // If you want incharge to delete completed issues, you'd need backend changes.
  const canDelete = (issue) => {
    // placeholder: incharge cannot delete as per current backend rules
    return false;
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
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Assigned Issues</h2>

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
            {issues.length > 0 ? (
              issues.map((issue) => (
                <tr key={issue.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{issue.id}</td>
                  <td className="px-4 py-3">{issue.title}</td>
                  {/* reporter may be nested differently depending on backend; try common fields */}
                  <td className="px-4 py-3">
                    {issue.reporter?.name || issue.reported_by || "N/A"}
                    <div className="text-xs text-gray-500">
                      {issue.reporter?.email || issue.reported_email || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">{issue.category || issue.department || "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                      disabled={busy}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleViewIssue(issue)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      View
                    </button>

                    {/* quick mark completed when in progress */}
                    {issue.status === "In Progress" ? (
                      <button
                        onClick={() => handleMarkCompleted(issue.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        disabled={busy}
                      >
                        Mark Completed
                      </button>
                    ) : (
                      // show disabled placeholder to keep spacing
                      <span className="text-gray-400 text-sm"> </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-6 italic">
                  No issues assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && selectedIssue && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="modal-content bg-white p-6 rounded w-11/12 md:w-1/2 max-h-[80vh] overflow-auto relative">
            <button
              className="close-btn absolute top-2 right-2 text-gray-700 font-bold"
              onClick={() => {
                setModalOpen(false);
                setSelectedIssue(null);
                setIssueComments([]);
                setCommentText("");
              }}
            >
              &times;
            </button>

            <h3 className="text-xl font-semibold mb-2">{selectedIssue.title}</h3>

            <p className="mb-2"><strong>Description:</strong> {selectedIssue.description}</p>

            <p className="mb-2">
              <strong>Reporter:</strong>{" "}
              {selectedIssue.reporter?.name || "Unknown"}{" "}
              <span className="text-gray-600">({selectedIssue.reporter?.email || "—"})</span>
            </p>

            <p className="mb-2">
              <strong>Reported at:</strong>{" "}
              {selectedIssue.created_at || selectedIssue.reported_at || "—"}
            </p>

            <p className="mb-2">
              <strong>Current status:</strong> {selectedIssue.status}
            </p>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Comments</h4>
              <div className="comments-list max-h-40 overflow-y-auto mb-2 border-t border-gray-300 pt-2">
                {issueComments.length === 0 ? (
                  <p className="text-gray-500">No comments yet.</p>
                ) : (
                  issueComments.map((c) => (
                    <div key={c.id} className="mb-2">
                      <strong>{c.author}</strong> <span className="text-xs text-gray-500">({c.author_role})</span>
                      <div>{c.comment_text}</div>
                      <div className="text-xs text-gray-400">{c.created_at}</div>
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
                  disabled={busy}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InchargeDashboard;
