# TruthLens API (backend)

Backend FastAPI pour la partie Communauté (publications, votes, signalements, commentaires) — persistance réelle en base SQLite, partagée entre tous les visiteurs du site.

## Démarrage

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1      # Windows — Mac/Linux : source venv/bin/activate
pip install -r requirements.txt
python seed.py                 # peuple la base avec 4 publications de démonstration (une seule fois)
uvicorn app.main:app --reload --port 8000
```

L'API tourne alors sur `http://localhost:8000`. Documentation interactive auto-générée : `http://localhost:8000/docs`.

## Connexion avec le frontend

Le frontend (`src/lib/api.js`) cherche l'API sur `http://localhost:8000` par défaut. Si le backend n'est pas démarré, l'application bascule automatiquement en mode local (localStorage) — **aucun écran d'erreur**, juste un badge "Mode local" dans l'onglet Communauté.

Pour pointer vers une autre adresse (ex. déploiement en ligne), créez un fichier `.env` à la racine du frontend :
```
VITE_API_URL=https://votre-backend-deploye.com
```

## Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | Vérifie que l'API répond |
| GET | `/posts` | Liste toutes les publications |
| POST | `/posts` | Crée une nouvelle publication (signalement) |
| GET | `/posts/{id}/comments` | Liste les commentaires d'une publication |
| POST | `/posts/{id}/comments` | Ajoute un commentaire |
| POST | `/posts/{id}/vote` | Vote ou signale (`{"direction": "up"}` ou `{"direction": "flag"}`) |

## Déploiement en ligne (pour que la communauté soit vraiment partagée entre tous les visiteurs, pas juste en local)

Ce backend est un service Python standard, déployable gratuitement sur Render.com ou Railway.app en quelques minutes (comme fait pour le projet IKAN AI si vous vous en êtes déjà servi). Base SQLite suffisante pour une démo ; passer à PostgreSQL pour une vraie mise en production durable.
