"""
Database configuration for the Project Management System.

Uses SQLite for development. The connection URL can be overridden via the
DATABASE_URL environment variable (see .env.example).
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from a .env file if python-dotenv is available.
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover - dotenv is optional
    pass

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./project_management.db")

# `check_same_thread` is only needed for SQLite so it can be used across
# FastAPI's threaded request handlers.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
