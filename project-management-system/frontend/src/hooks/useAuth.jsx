import { createContext, useContext, useEffect, useState } from "react"
import { authService } from "../services/index.js"
import { getToken, setToken } from "../services/api.js"

const AuthContext = createContext(null)

const USER_KEY = "pms_user"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  // On mount, if we have a token, validate it against the backend.
  useEffect(() => {
    let active = true
    async function bootstrap() {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const me = await authService.me()
        if (active) {
          setUser(me)
          localStorage.setItem(USER_KEY, JSON.stringify(me))
        }
      } catch {
        // Token invalid/expired — clear it.
        setToken(null)
        localStorage.removeItem(USER_KEY)
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      active = false
    }
  }, [])

  async function login(username, password) {
    const data = await authService.login(username, password)
    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return data.user
  }

  function logout() {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
