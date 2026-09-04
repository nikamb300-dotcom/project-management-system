import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard } from "lucide-react"
import { useAuth } from "../hooks/useAuth.jsx"
import { Alert, Button, Input, Spinner } from "../components/ui.jsx"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Project Management System</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert type="error">{error}</Alert>}

            <Input
              id="username"
              label="Username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-600">Default admin credentials</p>
            <p className="mt-1">
              Username: <span className="font-mono text-slate-800">admin</span> &nbsp;·&nbsp;
              Password: <span className="font-mono text-slate-800">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
