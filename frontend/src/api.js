import axios from 'axios'

// Use environment variable or default to localhost for development
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: baseURL
})

export const sweetsApi = {
  getAll: () => api.get('/sweets'),
  get: (id) => api.get(`/sweets/${id}`),
  create: (data) => api.post('/sweets', data),
  update: (id, data) => api.put(`/sweets/${id}`, data),
  delete: (id) => api.delete(`/sweets/${id}`),
}

export const salesApi = {
  getAll: () => api.get('/sales'),
  get: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
}

export const expensesApi = {
  getAll: () => api.get('/expenses'),
  get: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
}

export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

export const recipesApi = {
  addBrownies: () => api.post('/recipes/brownies'),
}

export default api
