import { Modal, PriorityBadge, StatusBadge } from "./ui.jsx"
import { formatDate, formatDateTime } from "../lib/format.js"

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-800">{children}</div>
    </div>
  )
}

export default function TaskViewModal({ open, onClose, task }) {
  if (!task) return null
  return (
    <Modal open={open} onClose={onClose} title={`Task #${task.id}`} size="md">
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
            {task.description || "No description provided."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <StatusBadge status={task.status} />
          </Field>
          <Field label="Priority">
            <PriorityBadge priority={task.priority} />
          </Field>
          <Field label="Assigned To">
            {task.assignee ? task.assignee.full_name : "Unassigned"}
          </Field>
          <Field label="Created By">{task.creator ? task.creator.full_name : "—"}</Field>
          <Field label="Due Date">{formatDate(task.due_date)}</Field>
          <Field label="Created">{formatDateTime(task.created_at)}</Field>
          <Field label="Last Modified">{formatDateTime(task.modified_at)}</Field>
          <Field label="Comments">{task.comments?.length ?? 0}</Field>
        </div>
      </div>
    </Modal>
  )
}
