import { X } from "lucide-react"

export function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

// -------------------- Button --------------------
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none"
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  }
  const sizes = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
    icon: "p-2",
  }
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

// -------------------- Input --------------------
export function Input({ label, id, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
          className
        )}
        {...props}
      />
    </div>
  )
}

// -------------------- Textarea --------------------
export function Textarea({ label, id, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
          className
        )}
        {...props}
      />
    </div>
  )
}

// -------------------- Select --------------------
export function Select({ label, id, children, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

// -------------------- Badge --------------------
export function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-amber-100 text-amber-800",
    "In Progress": "bg-blue-100 text-blue-800",
    Completed: "bg-emerald-100 text-emerald-800",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status] || "bg-slate-100 text-slate-700"
      )}
    >
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const config = {
    Low: { cls: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
    Medium: { cls: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
    High: { cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
  }
  const c = config[priority] || config.Medium
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        c.cls
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {priority}
    </span>
  )
}

// -------------------- Modal --------------------
export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  if (!open) return null
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full rounded-xl bg-white shadow-xl",
          sizes[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}

// -------------------- Confirm Dialog --------------------
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || "Confirm"}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Working..." : "Confirm"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  )
}

// -------------------- Spinner --------------------
export function Spinner({ className = "" }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingBlock({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  )
}

// -------------------- Alert --------------------
export function Alert({ type = "error", children }) {
  if (!children) return null
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  }
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", styles[type])} role="alert">
      {children}
    </div>
  )
}
