import axios from 'axios';
import { API_BASE_URL } from './runtimeConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('pmc_user');
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
