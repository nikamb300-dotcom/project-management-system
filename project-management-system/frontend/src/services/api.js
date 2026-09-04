import axios from "axios"

// The API base URL is read from the Vite env var VITE_API_URL.
// It falls back to localhost for local development. NEVER hard-code the
// Codespaces URL here — set it in frontend/.env instead.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const TOKEN_KEY = "pms_token"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

// Attach the JWT to every request as `Authorization: Bearer <token>`.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Normalize errors into user-friendly messages.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Something went wrong. Please try again."

    if (error.response) {
      const { status, data } = error.response
      const detail = data && (data.detail || data.message)

      if (status === 401) {
        message = detail || "Your session has expired. Please log in again."
        // Auto-logout on unauthorized (except on the login request itself).
        if (!error.config?.url?.includes("/api/auth/login")) {
          setToken(null)
          if (window.location.pathname !== "/login") {
            window.location.href = "/login"
          }
        }
      } else if (status === 403) {
        message = detail || "You are not authorized to perform this action."
      } else if (status === 404) {
        message = detail || "The requested resource was not found."
      } else if (status === 422) {
        // Pydantic validation error
        if (Array.isArray(detail)) {
          message = detail.map((d) => d.msg).join(", ")
        } else {
          message = detail || "Validation error. Please check your input."
        }
      } else if (status >= 500) {
        message = "A server error occurred. Please try again later."
      } else if (detail) {
        message = detail
      }
    } else if (error.request) {
      // No response received — backend unreachable.
      message = "Unable to connect to the Project Management API."
    }

    return Promise.reject(new Error(message))
  }
)

export default api
