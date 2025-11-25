import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axiosConfig";

const UserDashboard = ({ user, onLogout }) => {
  const [issues, setIssues] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [loading, setLoading] = useState(true);
  const [editingIssueId, setEditingIssueId] = useState(null);

  // Modal state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [issueComments, setIssueComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  // Fetch issues for current user
  const fetchMyIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get("/issues/user");
      setIssues(res.data || []);
    } catch (err) {
      console.error("Error fetching user issues:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for a specific issue
  const fetchIssueComments = async (issueId) => {
    try {
      const res = await api.get(`/issues/${issueId}/comments`);
      setIssueComments(res.data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setIssueComments([]);
    }
  };

  useEffect(() => {
    fetchMyIssues();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      alert("Please fill all required fields");
      return;
    }
    try {
      if (editingIssueId) {
        await api.put(`/issues/${editingIssueId}`, formData);
        setEditingIssueId(null);
      } else {
        await api.post("/issues", formData);
      }
      setFormData({ title: "", description: "", category: "" });
      fetchMyIssues();
    } catch (err) {
      console.error("Error submitting issue:", err);
      alert("Failed to submit issue");
    }
  };

  const handleEdit = (issue) => {
    setFormData({
      title: issue.title,
      description: issue.description,
      category: issue.category,
    });
    setEditingIssueId(issue.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      await api.delete(`/issues/${issueId}`);
      fetchMyIssues();
      if (selectedIssue?.id === issueId) setModalOpen(false);
    } catch (err) {
      console.error("Error deleting issue:", err);
      alert("Failed to delete issue");
    }
  };

  const handleViewIssue = async (issue) => {
    setSelectedIssue(issue);
    setModalOpen(true);
    await fetchIssueComments(issue.id);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/issues/${selectedIssue.id}/comment`, {
        comment: commentText,
      });
      // Append newly added comment with correct format
      setIssueComments([
        ...issueComments,
        {
          id: res.data.comment_id || Date.now(),
          author: user.name,
          author_role: "user",
          comment_text: commentText,
          created_at: new Date().toISOString(),
        },
      ]);
      setCommentText("");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-6">
          {editingIssueId ? "Edit Issue" : "My Issues"}
        </h1>

        {/* New/Edit Issue Form */}
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
            name="category"
            placeholder="Department / Category"
            value={formData.category}
            onChange={handleChange}
            className="border p-2 rounded col-span-1"
            required
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
            {editingIssueId ? "Update Issue" : "Submit Issue"}
          </button>
          {editingIssueId && (
            <button
              type="button"
              className="bg-gray-400 text-white py-2 rounded hover:bg-gray-500 col-span-3"
              onClick={() => {
                setFormData({ title: "", description: "", category: "" });
                setEditingIssueId(null);
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        {/* Issues Table */}
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
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{i.id}</td>
                    <td className="p-2 border">{i.title}</td>
                    <td className="p-2 border">{i.category}</td>
                    <td
                      className={`p-2 border font-medium ${
                        i.status === "Completed"
                          ? "text-green-600"
                          : i.status === "In Progress"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {i.status}
                    </td>
                    <td className="p-2 border">{i.incharge?.name || "Unassigned"}</td>
                    <td className="p-2 border">{new Date(i.created_at).toLocaleString()}</td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => handleEdit(i)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleViewIssue(i)}
                        className="text-green-600 hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(i.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Centered Modal */}
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

              <p className="mb-2">
                <strong>Description:</strong> {selectedIssue.description}
              </p>

              <p className="mb-2">
                <strong>Reporter:</strong> {user.name}{" "}
                <span className="text-gray-600">({user.email})</span>
              </p>

              <p className="mb-2">
                <strong>Reported at:</strong>{" "}
                {new Date(selectedIssue.created_at).toLocaleString()}
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
                        <strong>{c.author}</strong>{" "}
                        <span className="text-xs text-gray-500">({c.author_role})</span>
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
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
