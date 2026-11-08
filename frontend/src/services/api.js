import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export class BackendApiUnavailableError extends Error {
  constructor(resource) {
    super(`The backend does not currently expose an API for ${resource}.`);
    this.name = 'BackendApiUnavailableError';
    this.resource = resource;
  }
}

export async function getBackendHealth() {
  const response = await api.get('/');
  return response.data;
}

export async function registerUser(payload) {
  const response = await api.post('/api/users', payload);
  return response.data;
}

export const resourcesApi = {
  laboratories: unavailableResource('laboratories'),
  equipment: unavailableResource('equipment'),
  categories: unavailableResource('equipment categories'),
  complaints: unavailableResource('complaints'),
  assignments: unavailableResource('technician assignments'),
  repairs: unavailableResource('repair records'),
  maintenance: unavailableResource('maintenance records'),
};

function unavailableResource(resource) {
  const unavailable = async () => {
    throw new BackendApiUnavailableError(resource);
  };
  return { list: unavailable, create: unavailable, update: unavailable, remove: unavailable };
}
