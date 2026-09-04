"""
SQLAlchemy ORM models.

IMPORTANT: The `tasks` table has TWO foreign keys pointing to `users`
(`created_by_id` and `assigned_to_id`). To avoid SQLAlchemy's
AmbiguousForeignKeysError, every relationship between User and Task
explicitly specifies which foreign key it uses via `foreign_keys`.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")  # "admin" | "user"
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Tasks this user was ASSIGNED (tasks.assigned_to_id -> users.id)
    assigned_tasks = relationship(
        "Task",
        foreign_keys="Task.assigned_to_id",
        back_populates="assignee",
    )

    # Tasks this user CREATED (tasks.created_by_id -> users.id)
    created_tasks = relationship(
        "Task",
        foreign_keys="Task.created_by_id",
        back_populates="creator",
    )

    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, nullable=False, default="Pending")  # Pending | In Progress | Completed
    priority = Column(String, nullable=False, default="Medium")  # Low | Medium | High
    due_date = Column(DateTime, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Explicit foreign_keys avoid AmbiguousForeignKeysError.
    creator = relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_tasks",
    )
    assignee = relationship(
        "User",
        foreign_keys=[assigned_to_id],
        back_populates="assigned_tasks",
    )

    comments = relationship(
        "Comment",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Comment.created_at",
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="comments")
    author = relationship("User", foreign_keys=[user_id], back_populates="comments")
