
import axios from 'axios';

const baseURL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export async function getBackendHealth() {
  const response = await api.get('/');
  return response.data;
}

export async function getDashboard() {
  const response = await api.get('/api/reports/dashboard');
  return response.data;
}

export async function registerUser(payload) {
  const response = await api.post('/api/users', payload);
  return response.data;
}

function createResourceApi(endpoint) {
  return {
    async list() {
      const response = await api.get(endpoint);
      return response.data;
    },

    async create(payload) {
      const response = await api.post(endpoint, payload);
      return response.data;
    },

    async update(id, payload) {
      const response = await api.put(`${endpoint}/${id}`, payload);
      return response.data;
    },

    async remove(id) {
      const response = await api.delete(`${endpoint}/${id}`);
      return response.data;
    },
  };
}

export const resourcesApi = {
  laboratories: createResourceApi('/api/labs'),
  equipment: createResourceApi('/api/equipment'),
  categories: createResourceApi('/api/categories'),
  users: createResourceApi('/api/users'),
  complaints: createResourceApi('/api/complaints'),
  assignments: createResourceApi('/api/assignments'),
  repairs: createResourceApi('/api/repairs'),
  maintenance: createResourceApi('/api/maintenance'),
};