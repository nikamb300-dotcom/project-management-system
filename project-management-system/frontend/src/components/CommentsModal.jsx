import { useEffect, useState } from "react"
import { Send, Trash2 } from "lucide-react"
import { Alert, Button, LoadingBlock, Modal, Spinner } from "./ui.jsx"
import { commentService } from "../services/index.js"
import { useAuth } from "../hooks/useAuth.jsx"
import { formatDateTime } from "../lib/format.js"

/**
 * Comments viewer/creator for a task.
 * GET  /api/tasks/{id}/comments
 * POST /api/tasks/{id}/comments
 * DELETE /api/comments/{id}
 */
export default function CommentsModal({ open, onClose, task }) {
  const { user, isAdmin } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && task) {
      loadComments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id])

  async function loadComments() {
    setLoading(true)
    setError("")
    try {
      const data = await commentService.list(task.id)
      setComments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return
    setPosting(true)
    setError("")
    try {
      const created = await commentService.add(task.id, text.trim())
      setComments((c) => [...c, created])
      setText("")
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(commentId) {
    try {
      await commentService.remove(commentId)
      setComments((c) => c.filter((x) => x.id !== commentId))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Comments · ${task?.title || ""}`} size="md">
      <div className="flex flex-col gap-4">
        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <LoadingBlock label="Loading comments..." />
        ) : comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No comments yet. Be the first to add one.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => {
              const canDelete = isAdmin || c.user_id === user?.id
              return (
                <li key={c.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {c.author?.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {c.author?.full_name || "Unknown user"}
                        </p>
                        <p className="text-xs text-slate-400">{formatDateTime(c.created_at)}</p>
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{c.text}</p>
                </li>
              )
            })}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex items-end gap-2 border-t border-slate-200 pt-4">
          <textarea
            className="min-h-[44px] w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Add a comment..."
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                handleAdd(e)
              }
            }}
          />
          <Button type="submit" disabled={posting || !text.trim()} size="icon">
            {posting ? (
              <Spinner className="h-4 w-4 border-white/40 border-t-white" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
