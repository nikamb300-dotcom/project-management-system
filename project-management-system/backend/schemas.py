"""
Pydantic schemas (request/response models).

Field names here are the canonical API contract. The frontend uses these exact
names, so keep them in sync with the React `services` layer.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class UserBase(BaseModel):
    username: str
    full_name: str
    role: str = "user"  # "admin" | "user"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------
class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: int
    text: str
    created_at: datetime
    author: Optional[UserOut] = None


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = ""
    status: str = "Pending"       # Pending | In Progress | Completed
    priority: str = "Medium"      # Low | Medium | High
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_by_id: int
    created_at: datetime
    modified_at: datetime
    creator: Optional[UserOut] = None
    assignee: Optional[UserOut] = None
    comments: List[CommentOut] = []


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
class DashboardStats(BaseModel):
    total_tasks: int
    pending: int
    in_progress: int
    completed: int
    high_priority: int
    overdue: int
    recent_tasks: List[TaskOut]
    my_tasks: List[TaskOut]
    tasks_due_soon: List[TaskOut]


# Resolve forward reference (Token -> UserOut)
Token.model_rebuild()
