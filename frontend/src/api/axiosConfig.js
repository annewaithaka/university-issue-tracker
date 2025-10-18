// frontend/src/api/axiosConfig.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api", // backend /api prefix centralized here
  withCredentials: true,                // MUST send cookies for Flask-Login sessions
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
