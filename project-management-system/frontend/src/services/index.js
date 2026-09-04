import api from "./api.js"

// -------------------- Auth --------------------
export const authService = {
  login: (username, password) =>
    api.post("/api/auth/login", { username, password }).then((r) => r.data),
  register: (payload) => api.post("/api/auth/register", payload).then((r) => r.data),
  me: () => api.get("/api/auth/me").then((r) => r.data),
}

// -------------------- Users --------------------
export const userService = {
  list: () => api.get("/api/users").then((r) => r.data),
  get: (id) => api.get(`/api/users/${id}`).then((r) => r.data),
  create: (payload) => api.post("/api/auth/register", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/api/users/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/api/users/${id}`).then((r) => r.data),
}

// -------------------- Tasks --------------------
export const taskService = {
  list: (params = {}) => api.get("/api/tasks", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/tasks/${id}`).then((r) => r.data),
  create: (payload) => api.post("/api/tasks", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/api/tasks/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/api/tasks/${id}`).then((r) => r.data),
}

// -------------------- Comments --------------------
export const commentService = {
  list: (taskId) => api.get(`/api/tasks/${taskId}/comments`).then((r) => r.data),
  add: (taskId, text) =>
    api.post(`/api/tasks/${taskId}/comments`, { text }).then((r) => r.data),
  remove: (commentId) => api.delete(`/api/comments/${commentId}`).then((r) => r.data),
}

// -------------------- Dashboard --------------------
export const dashboardService = {
  get: () => api.get("/api/dashboard").then((r) => r.data),
}
