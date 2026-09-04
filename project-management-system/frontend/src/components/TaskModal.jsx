import { useEffect, useState } from "react"
import { Alert, Button, Input, Modal, Select, Spinner, Textarea } from "./ui.jsx"
import { taskService } from "../services/index.js"
import { toDateInput } from "../lib/format.js"

const STATUSES = ["Pending", "In Progress", "Completed"]
const PRIORITIES = ["Low", "Medium", "High"]

/**
 * Create/Edit task modal. If `task` is provided it edits, otherwise it creates.
 * Calls POST /api/tasks or PUT /api/tasks/{id} and invokes onSaved with the result.
 */
export default function TaskModal({ open, onClose, onSaved, task, users }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
    due_date: "",
    assigned_to_id: "",
  })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setError("")
      if (task) {
        setForm({
          title: task.title || "",
          description: task.description || "",
          status: task.status || "Pending",
          priority: task.priority || "Medium",
          due_date: toDateInput(task.due_date),
          assigned_to_id: task.assigned_to_id ? String(task.assigned_to_id) : "",
        })
      } else {
        setForm({
          title: "",
          description: "",
          status: "Pending",
          priority: "Medium",
          due_date: "",
          assigned_to_id: "",
        })
      }
    }
  }, [open, task])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!form.title.trim()) {
      setError("Title is required.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        assigned_to_id: form.assigned_to_id ? Number(form.assigned_to_id) : null,
      }
      const saved = isEdit
        ? await taskService.update(task.id, payload)
        : await taskService.create(payload)
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
      title={isEdit ? `Edit Task #${task?.id}` : "Create Task"}
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
              "Create Task"
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          id="title"
          label="Title"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
        />
        <Textarea
          id="description"
          label="Description"
          rows={3}
          placeholder="Describe the task..."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="status"
            label="Status"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            id="priority"
            label="Priority"
            value={form.priority}
            onChange={(e) => update("priority", e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="due_date"
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={(e) => update("due_date", e.target.value)}
          />
          <Select
            id="assigned_to_id"
            label="Assigned To"
            value={form.assigned_to_id}
            onChange={(e) => update("assigned_to_id", e.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} (@{u.username})
              </option>
            ))}
          </Select>
        </div>
      </form>
    </Modal>
  )
}
