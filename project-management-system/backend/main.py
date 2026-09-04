"""
FastAPI application entry point for the Project Management System.

Run with:
    uvicorn main:app --host 0.0.0.0 --port 8000

Interactive API docs are available at /docs.
"""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import Base, SessionLocal, engine, get_db

# Create tables on startup.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project Management System API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# For development we allow all origins so the React dev server (localhost:5173)
# and the GitHub Codespaces forwarded URL both work without extra config.
#
# PRODUCTION: replace allow_origins=["*"] with the actual frontend origin, e.g.
#     allow_origins=["https://your-frontend-domain.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Seed a default admin user on startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
def seed_default_admin() -> None:
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            admin = models.User(
                username="admin",
                password_hash=auth.hash_password("admin123"),
                full_name="Administrator",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


# ===========================================================================
# Authentication
# ===========================================================================
@app.post("/api/auth/login", response_model=schemas.Token, tags=["auth"])
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return schemas.Token(access_token=token, token_type="bearer", user=user)


@app.post("/api/auth/register", response_model=schemas.UserOut, tags=["auth"])
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with that username already exists.",
        )
    user = models.User(
        username=payload.username,
        password_hash=auth.hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role if payload.role in ("admin", "user") else "user",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/auth/me", response_model=schemas.UserOut, tags=["auth"])
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ===========================================================================
# Users
# ===========================================================================
@app.get("/api/users", response_model=List[schemas.UserOut], tags=["users"])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Any authenticated user can read the user list (needed for assignee dropdowns).
    return db.query(models.User).order_by(models.User.id).all()


@app.get("/api/users/{user_id}", response_model=schemas.UserOut, tags=["users"])
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@app.put("/api/users/{user_id}", response_model=schemas.UserOut, tags=["users"])
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None and payload.role in ("admin", "user"):
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.password_hash = auth.hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return user


@app.delete("/api/users/{user_id}", tags=["users"])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")

    # Re-assign or null out tasks that reference this user to keep FK integrity.
    db.query(models.Task).filter(models.Task.assigned_to_id == user_id).update(
        {models.Task.assigned_to_id: None}
    )
    db.delete(user)
    db.commit()
    return {"detail": "User deleted."}


# ===========================================================================
# Tasks
# ===========================================================================
def _can_edit_task(user: models.User, task: models.Task) -> bool:
    return (
        user.role == "admin"
        or task.created_by_id == user.id
        or task.assigned_to_id == user.id
    )


@app.get("/api/tasks", response_model=List[schemas.TaskOut], tags=["tasks"])
def list_tasks(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    due_before: Optional[datetime] = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.Task)

    # Non-admins only see tasks they created or are assigned to.
    if current_user.role != "admin":
        query = query.filter(
            or_(
                models.Task.created_by_id == current_user.id,
                models.Task.assigned_to_id == current_user.id,
            )
        )

    if mine:
        query = query.filter(models.Task.assigned_to_id == current_user.id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(models.Task.title.ilike(like), models.Task.description.ilike(like))
        )
    if status_filter:
        query = query.filter(models.Task.status == status_filter)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if assigned_to_id is not None:
        query = query.filter(models.Task.assigned_to_id == assigned_to_id)
    if due_before is not None:
        query = query.filter(models.Task.due_date <= due_before)

    return query.order_by(models.Task.created_at.desc()).all()


@app.get("/api/tasks/{task_id}", response_model=schemas.TaskOut, tags=["tasks"])
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    if current_user.role != "admin" and not _can_edit_task(current_user, task):
        raise HTTPException(status_code=403, detail="You do not have access to this task.")
    return task


@app.post("/api/tasks", response_model=schemas.TaskOut, tags=["tasks"])
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if payload.assigned_to_id is not None:
        assignee = db.query(models.User).filter(models.User.id == payload.assigned_to_id).first()
        if not assignee:
            raise HTTPException(status_code=400, detail="Assigned user not found.")

    task = models.Task(
        title=payload.title,
        description=payload.description or "",
        status=payload.status or "Pending",
        priority=payload.priority or "Medium",
        due_date=payload.due_date,
        assigned_to_id=payload.assigned_to_id,
        created_by_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.put("/api/tasks/{task_id}", response_model=schemas.TaskOut, tags=["tasks"])
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    if not _can_edit_task(current_user, task):
        raise HTTPException(
            status_code=403,
            detail="You can only modify tasks you created or are assigned to.",
        )

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.status is not None:
        task.status = payload.status
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.due_date is not None:
        task.due_date = payload.due_date
    if payload.assigned_to_id is not None:
        assignee = db.query(models.User).filter(models.User.id == payload.assigned_to_id).first()
        if not assignee:
            raise HTTPException(status_code=400, detail="Assigned user not found.")
        task.assigned_to_id = payload.assigned_to_id

    task.modified_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}", tags=["tasks"])
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    # Only admins or the task creator may delete.
    if current_user.role != "admin" and task.created_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only an admin or the task creator can delete this task.",
        )
    db.delete(task)
    db.commit()
    return {"detail": "Task deleted."}


# ===========================================================================
# Comments
# ===========================================================================
@app.get(
    "/api/tasks/{task_id}/comments",
    response_model=List[schemas.CommentOut],
    tags=["comments"],
)
def list_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    if current_user.role != "admin" and not _can_edit_task(current_user, task):
        raise HTTPException(status_code=403, detail="You do not have access to this task.")
    return (
        db.query(models.Comment)
        .filter(models.Comment.task_id == task_id)
        .order_by(models.Comment.created_at)
        .all()
    )


@app.post(
    "/api/tasks/{task_id}/comments",
    response_model=schemas.CommentOut,
    tags=["comments"],
)
def add_comment(
    task_id: int,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    if current_user.role != "admin" and not _can_edit_task(current_user, task):
        raise HTTPException(status_code=403, detail="You do not have access to this task.")

    comment = models.Comment(task_id=task_id, user_id=current_user.id, text=payload.text)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@app.delete("/api/comments/{comment_id}", tags=["comments"])
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    if current_user.role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own comments.",
        )
    db.delete(comment)
    db.commit()
    return {"detail": "Comment deleted."}


# ===========================================================================
# Dashboard
# ===========================================================================
@app.get("/api/dashboard", response_model=schemas.DashboardStats, tags=["dashboard"])
def dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    base = db.query(models.Task)
    if current_user.role != "admin":
        base = base.filter(
            or_(
                models.Task.created_by_id == current_user.id,
                models.Task.assigned_to_id == current_user.id,
            )
        )

    all_tasks = base.all()
    now = datetime.utcnow()
    soon = now + timedelta(days=3)

    def is_overdue(t: models.Task) -> bool:
        return t.due_date is not None and t.due_date < now and t.status != "Completed"

    total = len(all_tasks)
    pending = sum(1 for t in all_tasks if t.status == "Pending")
    in_progress = sum(1 for t in all_tasks if t.status == "In Progress")
    completed = sum(1 for t in all_tasks if t.status == "Completed")
    high_priority = sum(1 for t in all_tasks if t.priority == "High")
    overdue = sum(1 for t in all_tasks if is_overdue(t))

    recent_tasks = sorted(all_tasks, key=lambda t: t.created_at, reverse=True)[:5]
    my_tasks = [t for t in all_tasks if t.assigned_to_id == current_user.id][:5]
    tasks_due_soon = sorted(
        [
            t
            for t in all_tasks
            if t.due_date is not None and now <= t.due_date <= soon and t.status != "Completed"
        ],
        key=lambda t: t.due_date,
    )[:5]

    return schemas.DashboardStats(
        total_tasks=total,
        pending=pending,
        in_progress=in_progress,
        completed=completed,
        high_priority=high_priority,
        overdue=overdue,
        recent_tasks=recent_tasks,
        my_tasks=my_tasks,
        tasks_due_soon=tasks_due_soon,
    )


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "Project Management System API"}
