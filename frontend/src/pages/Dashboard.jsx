import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  // ✅ Fetch user & issues
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resUser = await api.get("/auth/me");
        setUser(resUser.data);

        const resIssues = await api.get("/issues");
        setIssues(resIssues.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // ✅ Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Submit new issue
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await api.post("/issues", form);
      setMessage("✅ Issue submitted successfully!");
      setForm({ title: "", description: "", category: "" });

      // refresh
      const refreshed = await api.get("/issues");
      setIssues(refreshed.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to submit issue");
    }
  };

  // ✅ Logout
  const handleLogout = async () => {
    await api.post("/auth/logout");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>🎓 University Issue Tracker</h1>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-gray-600">
              {user.name} ({user.role})
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* New Issue Form */}
      <div className="new-issue-form">
        <h2>Submit New Issue</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Issue title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Describe the issue..."
            value={form.description}
            onChange={handleChange}
            required
          ></textarea>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="Academic">Academic</option>
            <option value="Equipment">Equipment</option>
            <option value="Facility">Facility</option>
            <option value="Network">Network</option>
            <option value="Other">Other</option>
          </select>

          {message && <p>{message}</p>}

          <button type="submit">Submit Issue</button>
        </form>
      </div>

      {/* Issue List */}
      <div className="issue-grid">
        {issues.length === 0 ? (
          <p className="text-gray-500">No issues yet.</p>
        ) : (
          issues.map((i) => (
            <div key={i.id} className="issue-card">
              <h3>{i.title}</h3>
              <p className="issue-meta">{i.category}</p>
              <p>{i.description}</p>
              <p className="issue-meta">Date: {i.created_at}</p>
              <span
                className={`issue-status ${
                  i.status === "Pending"
                    ? "status-pending"
                    : "status-resolved"
                }`}
              >
                {i.status}
              </span>
            </div>
          ))
        )}
      </div>

      <footer className="dashboard-footer">
        University Tracking Issue System © 2025
      </footer>
    </div>
  );
}
