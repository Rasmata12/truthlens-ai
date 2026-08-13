from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .database import init_db, get_session
from .models import Post, Comment, PostCreate, CommentCreate, VoteAction
from .analyze import router as analyze_router

app = FastAPI(title="TruthLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only â€” restreindre au domaine du frontend en production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- POSTS (fil de la communautÃ©) ----------

@app.get("/posts", response_model=List[Post])
def list_posts(session: Session = Depends(get_session)):
    posts = session.exec(select(Post).order_by(Post.created_at.desc())).all()
    return posts


@app.post("/posts", response_model=Post)
def create_post(data: PostCreate, session: Session = Depends(get_session)):
    post = Post(**data.dict())
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


@app.get("/posts/{post_id}", response_model=Post)
def get_post(post_id: int, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    return post


@app.post("/posts/{post_id}/vote", response_model=Post)
def vote_post(post_id: int, action: VoteAction, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    if action.direction == "up":
        post.votes += 1
    elif action.direction == "flag":
        post.flags += 1
    else:
        raise HTTPException(status_code=400, detail="direction doit Ãªtre 'up' ou 'flag'")
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


# ---------- COMMENTS ----------

@app.get("/posts/{post_id}/comments", response_model=List[Comment])
def list_comments(post_id: int, session: Session = Depends(get_session)):
    comments = session.exec(
        select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at)
    ).all()
    return comments


@app.post("/posts/{post_id}/comments", response_model=Comment)
def add_comment(post_id: int, data: CommentCreate, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    comment = Comment(post_id=post_id, **data.dict())
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment

