import { useState } from "react"
import Layout from "../components/Layout.jsx"
import TaskManager from "../components/TaskManager.jsx"

export default function Tasks() {
  const [search, setSearch] = useState("")
  return (
    <Layout onSearch={setSearch} searchValue={search}>
      <TaskManager
        title="Tasks"
        subtitle="View, create, and manage all tasks."
        externalSearch={search}
      />
    </Layout>
  )
}
