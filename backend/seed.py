"""Peuple la base de données avec des publications de démonstration réalistes.
Lancer une seule fois : python seed.py
"""
from sqlmodel import Session, select
from app.database import engine, init_db
from app.models import Post, Comment

SEED_POSTS = [
    {
        "author": "Sophie Dubois", "platform": "Twitter / X",
        "title": "Vidéo d'une soucoupe volante survolant Paris hier soir",
        "content": "Cette vidéo circule partout ce matin. On y voit un disque argenté planer au-dessus de la Tour Eiffel avec des lumières clignotantes. Quelqu'un peut confirmer si c'est un montage 3D ?",
        "status": "En cours d'analyse", "votes": 89, "flags": 42,
        "comments": [
            {"author": "Jean-Marc L.", "content": "C'est visiblement un effet spécial de Blender. Le reflet sur la structure métallique ne correspond pas aux mouvements de la soucoupe."},
            {"author": "Sarah Becker (Modératrice)", "content": "Nous avons envoyé le fichier à notre détecteur de manipulation 3D. Rapport à venir."},
        ]
    },
    {
        "author": "Marc Vasseur", "platform": "Facebook",
        "title": "Article prétendant que le sel de mer guérit le COVID-19 en 24h",
        "content": "Mon oncle a partagé un lien affirmant que gargariser de l'eau tiède salée élimine 100% du virus. Cela me semble très dangereux.",
        "status": "Vérifié - Fake News", "votes": 215, "flags": 128,
        "comments": [
            {"author": "Docteur Diallo", "content": "Aucune étude scientifique ne prouve cela. C'est une fake news médicale dangereuse."},
        ]
    },
    {
        "author": "Lucas Martin", "platform": "TikTok",
        "title": "Image d'une tortue géante de 15 mètres de long en Indonésie",
        "content": "L'image montre des villageois debout sur le dos d'une tortue gigantesque. Vraie espèce oubliée ou Photoshop ?",
        "status": "Vérifié - Fake News", "votes": 34, "flags": 15,
        "comments": [
            {"author": "Elena R.", "content": "Généré par IA. Le pied du garçon à gauche s'enfonce bizarrement dans la carapace."},
        ]
    },
    {
        "author": "Clara Garcia", "platform": "Lien Direct",
        "title": "Déclaration officielle sur la baisse des impôts en 2027",
        "content": "J'ai reçu ce communiqué par email. Le document ressemble à un PDF officiel mais le ton est bizarrement informel par endroits.",
        "status": "Vérifié - Fiable", "votes": 18, "flags": 5,
        "comments": [
            {"author": "Admin TruthLens", "content": "Après vérification de la signature électronique, ce communiqué est authentique."},
        ]
    },
]


def run():
    init_db()
    with Session(engine) as session:
        existing = session.exec(select(Post)).first()
        if existing:
            print("La base contient déjà des données — rien à faire.")
            return

        for item in SEED_POSTS:
            comments_data = item.pop("comments")
            post = Post(**item)
            session.add(post)
            session.commit()
            session.refresh(post)
            for c in comments_data:
                session.add(Comment(post_id=post.id, **c))
            session.commit()

        print(f"{len(SEED_POSTS)} publications de démonstration ajoutées.")


if __name__ == "__main__":
    run()
