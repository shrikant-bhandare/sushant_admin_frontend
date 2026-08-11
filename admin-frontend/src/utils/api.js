import axios from "axios";

const API_URL = import.meta.env.VITE_APIURL || "http://localhost:3000";

/**
 * Centralized Axios instance with automatic JWT auth header injection.
 * Use this for ALL API calls instead of raw axios/fetch.
 *
 * Usage:
 *   import api from '@/utils/api';
 *   const res = await api.get('/api/sale-orders');
 *   const res = await api.post('/api/invoices/upload', formData);
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor — inject Bearer token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't override Content-Type for FormData (let browser set multipart boundary)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("401 Unauthorized — redirecting to login");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
