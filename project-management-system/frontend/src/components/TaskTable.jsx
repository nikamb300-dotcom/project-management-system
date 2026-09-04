import { Eye, MessageSquare, Pencil, Trash2 } from "lucide-react"
import { PriorityBadge, StatusBadge } from "./ui.jsx"
import { formatDate, isOverdue } from "../lib/format.js"

/**
 * Professional task data table.
 * Columns: Task ID, Title, Assigned To, Status, Priority, Due Date,
 *          Created Date, Modified Date, Actions.
 */
export default function TaskTable({ tasks, onView, onEdit, onComments, onDelete, canModify }) {
  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">No tasks found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Assigned To</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Modified</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">#{task.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{task.title}</p>
                  {task.description && (
                    <p className="max-w-xs truncate text-xs text-slate-400">{task.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {task.assignee ? task.assignee.full_name : <span className="text-slate-400">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3">
                  <span className={isOverdue(task) ? "font-medium text-red-600" : "text-slate-700"}>
                    {formatDate(task.due_date)}
                    {isOverdue(task) && <span className="ml-1 text-xs">(overdue)</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(task.created_at)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(task.modified_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton title="View" onClick={() => onView(task)}>
                      <Eye size={16} />
                    </IconButton>
                    <IconButton title="Comments" onClick={() => onComments(task)}>
                      <MessageSquare size={16} />
                    </IconButton>
                    {canModify(task) && (
                      <IconButton title="Edit" onClick={() => onEdit(task)}>
                        <Pencil size={16} />
                      </IconButton>
                    )}
                    {canModify(task) && (
                      <IconButton title="Delete" variant="danger" onClick={() => onDelete(task)}>
                        <Trash2 size={16} />
                      </IconButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IconButton({ children, title, onClick, variant = "default" }) {
  const styles =
    variant === "danger"
      ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
      : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-lg p-1.5 transition-colors ${styles}`}
    >
      {children}
    </button>
  )
}
