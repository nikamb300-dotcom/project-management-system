import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, UserCheck, UserX } from "lucide-react"
import Layout from "../components/Layout.jsx"
import { Alert, Button, ConfirmDialog, LoadingBlock } from "../components/ui.jsx"
import UserModal from "../components/UserModal.jsx"
import { userService } from "../services/index.js"
import { useAuth } from "../hooks/useAuth.jsx"
import { formatDate } from "../lib/format.js"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const data = await userService.list()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete() {
    if (!deleteUser) return
    setDeleting(true)
    try {
      await userService.remove(deleteUser.id)
      setUsers((u) => u.filter((x) => x.id !== deleteUser.id))
      setDeleteUser(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users</h1>
            <p className="mt-1 text-sm text-slate-500">Manage user accounts and roles.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Create User
          </Button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <LoadingBlock label="Loading users..." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Full Name</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">#{u.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {u.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">@{u.username}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            u.role === "admin"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <UserCheck size={14} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                            <UserX size={14} /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser(u)}
                            title="Edit"
                            aria-label="Edit user"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteUser(u)}
                            disabled={u.id === currentUser?.id}
                            title={u.id === currentUser?.id ? "You cannot delete yourself" : "Delete"}
                            aria-label="Delete user"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <UserModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={load} />
        <UserModal open={!!editUser} user={editUser} onClose={() => setEditUser(null)} onSaved={load} />
        <ConfirmDialog
          open={!!deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Delete User"
          message={`Are you sure you want to delete ${deleteUser?.full_name}? Their tasks will be unassigned.`}
        />
      </div>
    </Layout>
  )
}
