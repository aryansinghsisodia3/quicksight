import axios from 'axios';

// Ensure the trailing slash is managed cleanly
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL,
});

export default api;
