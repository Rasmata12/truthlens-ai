from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author: str
    platform: str
    title: str
    content: str
    status: str = Field(default="En cours d'analyse")
    votes: int = Field(default=0)
    flags: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="post.id")
    author: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Report(SQLModel, table=True):
    """A verification report submitted from the Verifier, optionally linked to a community post."""
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: Optional[int] = Field(default=None, foreign_key="post.id")
    input_type: str
    input_value: str
    score: int
    verdict: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Pydantic-style request bodies (SQLModel non-table models) ---

class PostCreate(SQLModel):
    author: str
    platform: str
    title: str
    content: str


class CommentCreate(SQLModel):
    author: str
    content: str


class VoteAction(SQLModel):
    direction: str  # "up" or "flag"
