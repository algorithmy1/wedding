import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data
  },
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/api/auth/register', { email, password, name })
    return response.data
  },
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },
}

export const guestsAPI = {
  list: async (filters?: { search?: string; rsvp_status?: string; group_name?: string }) => {
    const response = await api.get('/api/guests', { params: filters })
    return response.data
  },
  get: async (id: string) => {
    const response = await api.get(`/api/guests/${id}`)
    return response.data
  },
  create: async (data: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    group_name?: string
    plus_one_allowed?: boolean
    dietary_restrictions?: string
    language?: string
    table_number?: number
    notes?: string
  }) => {
    const response = await api.post('/api/guests', data)
    return response.data
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/api/guests/${id}`, data)
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/guests/${id}`)
    return response.data
  },
  stats: async () => {
    const response = await api.get('/api/guests/stats')
    return response.data
  },
}

export const eventsAPI = {
  list: async () => {
    const response = await api.get('/api/events')
    return response.data
  },
  listAll: async () => {
    const response = await api.get('/api/events/all')
    return response.data
  },
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/api/events', data)
    return response.data
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/api/events/${id}`, data)
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/events/${id}`)
    return response.data
  },
}

export const rsvpAPI = {
  lookup: async (code: string) => {
    const response = await api.get(`/api/rsvp/lookup/${code}`)
    return response.data
  },
  submit: async (data: {
    rsvp_code: string
    rsvp_status: string
    plus_one_name?: string
    plus_one_attending?: boolean
    dietary_restrictions?: string
    message?: string
  }) => {
    const response = await api.post('/api/rsvp/submit', data)
    return response.data
  },
}
