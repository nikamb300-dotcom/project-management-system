import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import Layout from "../components/Layout.jsx"
import { Alert, LoadingBlock } from "../components/ui.jsx"
import { taskService } from "../services/index.js"
import { isOverdue } from "../lib/format.js"

const PRIORITY_COLORS = { Low: "#94a3b8", Medium: "#6366f1", High: "#ef4444" }

export default function Reports() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await taskService.list()
        if (active) setTasks(data)
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

  const { priorityData, assigneeData, completionRate, overdueCount } = useMemo(() => {
    const priorityCounts = { Low: 0, Medium: 0, High: 0 }
    const assigneeCounts = {}
    let completed = 0
    let overdue = 0

    for (const t of tasks) {
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1
      const name = t.assignee ? t.assignee.full_name : "Unassigned"
      assigneeCounts[name] = (assigneeCounts[name] || 0) + 1
      if (t.status === "Completed") completed += 1
      if (isOverdue(t)) overdue += 1
    }

    return {
      priorityData: Object.entries(priorityCounts).map(([name, value]) => ({ name, value })),
      assigneeData: Object.entries(assigneeCounts).map(([name, value]) => ({ name, value })),
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      overdueCount: overdue,
    }
  }, [tasks])

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Analytics and insights across your tasks.</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <LoadingBlock label="Loading reports..." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard label="Total Tasks" value={tasks.length} />
              <SummaryCard label="Completion Rate" value={`${completionRate}%`} />
              <SummaryCard label="Overdue Tasks" value={overdueCount} accent="text-red-600" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks by Priority</h2>
                {tasks.length === 0 ? (
                  <Empty />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label
                        >
                          {priorityData.map((entry) => (
                            <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks by Assignee</h2>
                {tasks.length === 0 ? (
                  <Empty />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={assigneeData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={110}
                          tick={{ fontSize: 12, fill: "#64748b" }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function SummaryCard({ label, value, accent = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

function Empty() {
  return <p className="py-20 text-center text-sm text-slate-400">No task data available.</p>
}
