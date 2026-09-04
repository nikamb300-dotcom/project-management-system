import { useState } from "react"
import Layout from "../components/Layout.jsx"
import TaskManager from "../components/TaskManager.jsx"

export default function MyTasks() {
  const [search, setSearch] = useState("")
  return (
    <Layout onSearch={setSearch} searchValue={search}>
      <TaskManager
        title="My Tasks"
        subtitle="Tasks assigned to you."
        mineOnly
        externalSearch={search}
      />
    </Layout>
  )
}
