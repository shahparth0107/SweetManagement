// src/api/client.js
import axios from 'axios'
const BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } })
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth:user')
  if (raw) {
    const { user } = JSON.parse(raw)
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

export const AuthAPI = {
  register: (payload) => api.post('/auth/register', payload),
  login:    (payload) => api.post('/auth/login', payload),
}

export const SweetsAPI = {
  list:     () => api.get('/sweets/getSweets'),
  search:   (params) => api.get('/sweets/searchSweet', { params }),
  create:   (payload) => api.post('/sweets/createSweet', payload),
  update:   (id, payload) => api.put(`/sweets/updateSweet/${id}`, payload),
  remove:   (id) => api.delete(`/sweets/deleteSweet/${id}`),
  purchase: (id, quantity=1) => api.post(`/sweets/${id}/purchase`, { quantity }),
  restock:  (id, quantity)   => api.post(`/sweets/${id}/restock`, { quantity }),
}
