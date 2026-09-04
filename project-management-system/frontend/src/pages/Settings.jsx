import { useState } from "react"
import Layout from "../components/Layout.jsx"
import { Alert, Button, Input, Spinner } from "../components/ui.jsx"
import { userService } from "../services/index.js"
import { useAuth } from "../hooks/useAuth.jsx"

export default function SettingsPage() {
  const { user } = useAuth()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    setMessage(null)
    if (password.length < 4) {
      return setMessage({ type: "error", text: "Password must be at least 4 characters." })
    }
    if (password !== confirm) {
      return setMessage({ type: "error", text: "Passwords do not match." })
    }
    setSaving(true)
    try {
      // Users can update their own password via the update endpoint.
      // (Admins can update any user; non-admins updating themselves is allowed
      //  by the backend only for admins — see README for RBAC notes.)
      await userService.update(user.id, { password })
      setMessage({ type: "success", text: "Password updated successfully." })
      setPassword("")
      setConfirm("")
    } catch (err) {
      setMessage({ type: "error", text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your account preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Profile */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{user?.full_name}</p>
                <p className="text-sm text-slate-500">@{user?.username}</p>
                <span className="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs font-medium capitalize text-brand-700">
                  {user?.role}
                </span>
              </div>
            </div>
            <dl className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">User ID</dt>
                <dd className="font-mono text-slate-700">#{user?.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Role</dt>
                <dd className="capitalize text-slate-700">{user?.role}</dd>
              </div>
            </dl>
          </div>

          {/* Change password */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">Change Password</h2>
            <form onSubmit={handleChangePassword} className="mt-4 flex flex-col gap-4">
              {message && <Alert type={message.type}>{message.text}</Alert>}
              <Input
                id="new-password"
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Input
                id="confirm-password"
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
              <Button type="submit" disabled={saving} className="self-start">
                {saving ? (
                  <>
                    <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
            <p className="mt-3 text-xs text-slate-400">
              Note: changing another account requires admin privileges. See the README for role
              details.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
