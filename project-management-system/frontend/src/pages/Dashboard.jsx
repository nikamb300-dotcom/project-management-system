import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Loader2,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import Layout from "../components/Layout.jsx"
import { Alert, LoadingBlock, PriorityBadge, StatusBadge } from "../components/ui.jsx"
import { dashboardService } from "../services/index.js"
import { useAuth } from "../hooks/useAuth.jsx"
import { formatDate, isOverdue } from "../lib/format.js"

const STAT_CONFIG = [
  { key: "total_tasks", label: "Total Tasks", icon: ListTodo, color: "text-brand-600 bg-brand-50" },
  { key: "pending", label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50" },
  { key: "in_progress", label: "In Progress", icon: Loader2, color: "text-blue-600 bg-blue-50" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  { key: "high_priority", label: "High Priority", icon: Flame, color: "text-red-600 bg-red-50" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, color: "text-orange-600 bg-orange-50" },
]

const STATUS_COLORS = { Pending: "#f59e0b", "In Progress": "#3b82f6", Completed: "#10b981" }

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await dashboardService.get()
        if (active) setData(res)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const statusChart = data
    ? [
        { name: "Pending", value: data.pending },
        { name: "In Progress", value: data.in_progress },
        { name: "Completed", value: data.completed },
      ]
    : []

  const barChart = data
    ? [
        { name: "Total", value: data.total_tasks },
        { name: "Pending", value: data.pending },
        { name: "In Progress", value: data.in_progress },
        { name: "Completed", value: data.completed },
        { name: "High", value: data.high_priority },
        { name: "Overdue", value: data.overdue },
      ]
    : []

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.full_name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is an overview of your projects and tasks.
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <LoadingBlock label="Loading dashboard..." />
        ) : data ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {STAT_CONFIG.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.key}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className={`mb-3 inline-flex rounded-lg p-2 ${stat.color}`}>
                      <Icon size={20} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{data[stat.key]}</p>
                    <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">Task Overview</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChart}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">Task Status Summary</h2>
                {data.total_tasks === 0 ? (
                  <p className="py-16 text-center text-sm text-slate-400">No tasks yet.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChart}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {statusChart.map((entry) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {statusChart.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[s.name] }}
                      />
                      {s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Task lists */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <TaskList title="Recent Tasks" tasks={data.recent_tasks} empty="No recent tasks." />
              <TaskList title="My Tasks" tasks={data.my_tasks} empty="No tasks assigned to you." />
              <TaskList
                title="Tasks Due Soon"
                tasks={data.tasks_due_soon}
                empty="Nothing due in the next 3 days."
                showDue
              />
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  )
}

function TaskList({ title, tasks, empty, showDue }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {tasks.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">{empty}</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">{task.title}</p>
                <PriorityBadge priority={task.priority} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge status={task.status} />
                {showDue && (
                  <span
                    className={`text-xs ${
                      isOverdue(task) ? "font-medium text-red-600" : "text-slate-400"
                    }`}
                  >
                    Due {formatDate(task.due_date)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
