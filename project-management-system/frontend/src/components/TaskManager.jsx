import { useEffect, useMemo, useState } from "react"
import { Filter, Plus, X } from "lucide-react"
import { Alert, Button, LoadingBlock, Select } from "./ui.jsx"
import TaskTable from "./TaskTable.jsx"
import TaskModal from "./TaskModal.jsx"
import TaskViewModal from "./TaskViewModal.jsx"
import CommentsModal from "./CommentsModal.jsx"
import { ConfirmDialog } from "./ui.jsx"
import { taskService, userService } from "../services/index.js"
import { useAuth } from "../hooks/useAuth.jsx"

const STATUSES = ["Pending", "In Progress", "Completed"]
const PRIORITIES = ["Low", "Medium", "High"]

export default function TaskManager({ title, subtitle, mineOnly = false, externalSearch }) {
  const { user, isAdmin } = useAuth()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [assigneeFilter, setAssigneeFilter] = useState("")
  const [dueBefore, setDueBefore] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [viewTask, setViewTask] = useState(null)
  const [commentsTask, setCommentsTask] = useState(null)
  const [deleteTask, setDeleteTask] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const effectiveSearch = externalSearch ?? search

  async function loadTasks() {
    setLoading(true)
    setError("")
    try {
      const params = {}
      if (effectiveSearch) params.search = effectiveSearch
      if (statusFilter) params.status_filter = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (assigneeFilter) params.assigned_to_id = assigneeFilter
      if (dueBefore) params.due_before = new Date(dueBefore).toISOString()
      if (mineOnly) params.mine = true
      const data = await taskService.list(params)
      setTasks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    try {
      const data = await userService.list()
      setUsers(data)
    } catch {
      // non-fatal; assignee dropdown will just be empty
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced reload when filters/search change.
  useEffect(() => {
    const t = setTimeout(loadTasks, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSearch, statusFilter, priorityFilter, assigneeFilter, dueBefore, mineOnly])

  function canModify(task) {
    return isAdmin || task.created_by_id === user?.id || task.assigned_to_id === user?.id
  }

  function clearFilters() {
    setSearch("")
    setStatusFilter("")
    setPriorityFilter("")
    setAssigneeFilter("")
    setDueBefore("")
  }

  async function handleDelete() {
    if (!deleteTask) return
    setDeleting(true)
    try {
      await taskService.remove(deleteTask.id)
      setTasks((t) => t.filter((x) => x.id !== deleteTask.id))
      setDeleteTask(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  function handleSaved() {
    loadTasks()
  }

  const hasActiveFilters =
    search || statusFilter || priorityFilter || assigneeFilter || dueBefore

  const filteredForDisplay = useMemo(() => tasks, [tasks])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowFilters((v) => !v)}>
            <Filter size={16} />
            Filters
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Create Task
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {externalSearch === undefined && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="search" className="text-sm font-medium text-slate-700">
                  Search
                </label>
                <input
                  id="search"
                  type="search"
                  placeholder="Title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}
            <Select
              id="status-filter"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              id="priority-filter"
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Select
              id="assignee-filter"
              label="Assigned To"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </Select>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="due-before" className="text-sm font-medium text-slate-700">
                Due before
              </label>
              <input
                id="due-before"
                type="date"
                value={dueBefore}
                onChange={(e) => setDueBefore(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={14} />
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <LoadingBlock label="Loading tasks..." />
      ) : (
        <TaskTable
          tasks={filteredForDisplay}
          canModify={canModify}
          onView={setViewTask}
          onEdit={setEditTask}
          onComments={setCommentsTask}
          onDelete={setDeleteTask}
        />
      )}

      {/* Create */}
      <TaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={handleSaved}
        users={users}
      />
      {/* Edit */}
      <TaskModal
        open={!!editTask}
        task={editTask}
        onClose={() => setEditTask(null)}
        onSaved={handleSaved}
        users={users}
      />
      {/* View */}
      <TaskViewModal open={!!viewTask} task={viewTask} onClose={() => setViewTask(null)} />
      {/* Comments */}
      <CommentsModal
        open={!!commentsTask}
        task={commentsTask}
        onClose={() => setCommentsTask(null)}
      />
      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTask?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}
