import os
from sqlmodel import SQLModel, Session, create_engine, select

DATABASE_URL = "sqlite:///./truthlens.db"

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

_CLEANUP_MARKER = "._demo_posts_cleaned"


def init_db():
    SQLModel.metadata.create_all(engine)

    # Nettoyage unique : retire les publications de démonstration qui auraient
    # été créées par une ancienne version de seed.py, sur une base déjà existante.
    # Ne s'exécute qu'une seule fois (marqueur sur disque) pour ne jamais toucher
    # aux vraies publications ajoutées ensuite par de vrais utilisateurs.
    if not os.path.exists(_CLEANUP_MARKER):
        from .models import Post, Comment
        with Session(engine) as session:
            # Premier démarrage après ce correctif : on vide tout, quels que
            # soient les auteurs — la communauté doit repartir de zéro, avec
            # uniquement de vraies publications ajoutées par de vrais utilisateurs
            # à partir de maintenant.
            for c in session.exec(select(Comment)).all():
                session.delete(c)
            for p in session.exec(select(Post)).all():
                session.delete(p)
            session.commit()
        with open(_CLEANUP_MARKER, "w") as f:
            f.write("done")


def get_session():
    with Session(engine) as session:
        yield session
