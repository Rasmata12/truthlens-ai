# Héberger TruthLens AI en ligne (Render.com)

Même plateforme que celle déjà utilisée pour IKAN AI — gratuite pour ce niveau d'usage.

---

## Étape 1 — Créer le dépôt GitHub

1. Allez sur [github.com/new](https://github.com/new)
2. Nom du dépôt : `truthlens-ai`
3. Laissez tout décoché (pas de README, pas de .gitignore — vous les avez déjà)
4. Cliquez "Create repository"

## Étape 2 — Pousser le code

Dans PowerShell, à la racine de votre dossier projet (celui avec `package.json` et `backend/`) :

```powershell
git init
git add .
git commit -m "Version initiale"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM-UTILISATEUR/truthlens-ai.git
git push -u origin main
```

Remplacez `VOTRE-NOM-UTILISATEUR` par votre vrai nom d'utilisateur GitHub — l'URL exacte est affichée sur la page GitHub juste après la création du dépôt (bouton "Copier" à côté).

**Si `git` n'est pas reconnu :** installez-le depuis [git-scm.com/download/win](https://git-scm.com/download/win), puis fermez et rouvrez PowerShell.

---

## Étape 3 — Déployer le backend (API)

Sur [render.com](https://render.com), connectez-vous (ou créez un compte gratuit avec GitHub) :

1. **New +** → **Web Service**
2. Connectez votre dépôt `truthlens-ai`
3. Configurez exactement comme suit :

| Champ | Valeur |
|---|---|
| Name | `truthlens-api` (ou ce que vous voulez) |
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | `Free` |

4. Cliquez **Create Web Service**
5. Attendez que le statut passe à **Live** (2-4 minutes)
6. **Copiez l'URL affichée en haut** (ex: `https://truthlens-api.onrender.com`) — vous en aurez besoin à l'étape suivante

**Note importante :** sur le plan gratuit, la base de données SQLite est effacée à chaque redéploiement du service, et le serveur "s'endort" après 15 minutes d'inactivité (la première requête après une pause prend alors 30-60 secondes à répondre). C'est normal et suffisant pour une démonstration.

---

## Étape 4 — Déployer le frontend (site)

Toujours sur Render :

1. **New +** → **Static Site**
2. Même dépôt `truthlens-ai`
3. Configurez :

| Champ | Valeur |
|---|---|
| Name | `truthlens-frontend` |
| Root Directory | *(laisser vide)* |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

4. **Avant de cliquer sur Create**, ouvrez la section **"Advanced"** → **Add Environment Variable** :
   - Key : `VITE_API_URL`
   - Value : l'URL du backend copiée à l'étape 3 (ex: `https://truthlens-api.onrender.com`)

   **C'est l'étape la plus importante — sans elle, le site déployé cherchera un serveur sur `localhost`, qui n'existe pas pour vos visiteurs.**

5. Cliquez **Create Static Site**
6. Attendez le statut **Live** (2-3 minutes)

---

## Étape 5 — Le lien final

L'URL affichée en haut de la page du Static Site (ex : `https://truthlens-frontend.onrender.com`) est **le lien à partager**.

**Pour vérifier que tout est bien branché :** ouvrez ce lien, allez dans l'onglet Communauté, et regardez le badge — il doit afficher **"Connecté au serveur"**. S'il affiche "Mode local", revérifiez que `VITE_API_URL` a bien été configurée à l'étape 4 (une variable d'environnement ajoutée après coup nécessite un nouveau déploiement manuel : bouton **Manual Deploy** sur la page du Static Site).

---

## Si vous modifiez le code plus tard

```powershell
git add .
git commit -m "Description du changement"
git push
```

Render redéploie automatiquement les deux services à chaque `push` — pas besoin de repasser par ce guide.
