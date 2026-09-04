import { useEffect, useState } from "react"
import { Alert, Button, Input, Modal, Select, Spinner } from "./ui.jsx"
import { userService } from "../services/index.js"

/**
 * Create/Edit user modal (admin only).
 * Create -> POST /api/auth/register
 * Edit   -> PUT  /api/users/{id}
 */
export default function UserModal({ open, onClose, onSaved, user }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    role: "user",
    password: "",
    is_active: true,
  })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setError("")
      if (user) {
        setForm({
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          password: "",
          is_active: user.is_active,
        })
      } else {
        setForm({ username: "", full_name: "", role: "user", password: "", is_active: true })
      }
    }
  }, [open, user])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!form.full_name.trim()) return setError("Full name is required.")
    if (!isEdit && !form.username.trim()) return setError("Username is required.")
    if (!isEdit && !form.password) return setError("Password is required for new users.")

    setSaving(true)
    try {
      let saved
      if (isEdit) {
        const payload = {
          full_name: form.full_name,
          role: form.role,
          is_active: form.is_active,
        }
        if (form.password) payload.password = form.password
        saved = await userService.update(user.id, payload)
      } else {
        saved = await userService.create({
          username: form.username.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
          password: form.password,
        })
      }
      onSaved?.(saved)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit User: ${user?.username}` : "Create User"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                Saving...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create User"
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          id="full_name"
          label="Full Name"
          placeholder="Jane Doe"
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          required
        />
        <Input
          id="username"
          label="Username"
          placeholder="jane"
          value={form.username}
          onChange={(e) => update("username", e.target.value)}
          disabled={isEdit}
          required={!isEdit}
        />
        <Input
          id="password"
          label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          required={!isEdit}
        />
        <Select
          id="role"
          label="Role"
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </Select>
        {isEdit && (
          <Select
            id="is_active"
            label="Account Status"
            value={form.is_active ? "active" : "disabled"}
            onChange={(e) => update("is_active", e.target.value === "active")}
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
        )}
      </form>
    </Modal>
  )
}
