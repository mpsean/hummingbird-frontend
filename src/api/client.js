import axios from 'axios'
import { getToken, clearToken, redirectToSignin } from '../auth/useAuth'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(cfg => {
  const token = getToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    clearToken()
    redirectToSignin()
  }
  return Promise.reject(err)
})

// ── Config ────────────────────────────────────────────────────────────────────
export const configApi = {
  getAll: () => api.get('/config').then(r => r.data),
  get: (key) => api.get(`/config/${key}`).then(r => r.data),
  set: (key, value) => api.put(`/config/${key}`, { value }).then(r => r.data),
  onboard: (data) => api.post('/config/onboard', data).then(r => r.data),
}

// ── Personnel ─────────────────────────────────────────────────────────────────
export const personnelApi = {
  // Employees
  getEmployees: (status) =>
    api.get('/personnel/employees', { params: status ? { status } : {} }).then(r => r.data),
  createEmployee: (data) => api.post('/personnel/employees', data).then(r => r.data),
  updateEmployee: (id, data) => api.put(`/personnel/employees/${id}`, data).then(r => r.data),
  deleteEmployee: (id) => api.delete(`/personnel/employees/${id}`).then(r => r.data),
  importEmployeesCsv: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/personnel/employees/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  // Positions
  getPositions: () => api.get('/personnel/positions').then(r => r.data),
  createPosition: (data) => api.post('/personnel/positions', data).then(r => r.data),
  updatePosition: (id, data) => api.put(`/personnel/positions/${id}`, data).then(r => r.data),
  deletePosition: (id) => api.delete(`/personnel/positions/${id}`).then(r => r.data),
}

// ── Time Attendance ───────────────────────────────────────────────────────────
export const taApi = {
  importCsv: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/timeattendance/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  getByMonth: (year, month) =>
    api.get(`/timeattendance/${year}/${month}`).then(r => r.data),
  getSummary: (year, month) =>
    api.get(`/timeattendance/${year}/${month}/summary`).then(r => r.data),
  getMonths: () => api.get('/timeattendance/months').then(r => r.data),
  deleteMonth: (year, month) =>
    api.delete(`/timeattendance/${year}/${month}`).then(r => r.data),
}

// ── Payroll ───────────────────────────────────────────────────────────────────
export const payrollApi = {
  calculate: (data) => api.post('/payroll/calculate', data).then(r => r.data),
  get: (year, month) => api.get(`/payroll/${year}/${month}`).then(r => r.data),
  getMonths: () => api.get('/payroll/months').then(r => r.data),
}

export default api
