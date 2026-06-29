import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
})

// Request Interceptor: Attach Auth Token if exists
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export interface ApiError {
  message: string
  status?: number
  code?: string
  errors?: Record<string, string[]>
}

// Response Interceptor: Standardize API Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'Something went wrong. Please try again.',
    }

    if (error.response) {
      apiError.status = error.response.status
      const data = error.response.data as any
      apiError.message = data?.message || error.response.statusText
      apiError.errors = data?.errors
      apiError.code = data?.code
    } else if (error.request) {
      apiError.message = 'No response received from the server. Check your network.'
    } else {
      apiError.message = error.message
    }

    return Promise.reject(apiError)
  }
)

export default apiClient
