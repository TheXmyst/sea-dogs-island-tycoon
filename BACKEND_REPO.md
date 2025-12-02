# Backend Repository

Le backend a été déplacé vers un repository privé séparé pour des raisons de sécurité.

## Repository Backend

**URL SSH:** `git@github.com:TheXmyst/sea-dogs-backend.git`

## Mise à jour Railway

Pour que Railway continue de déployer le backend, vous devez mettre à jour la configuration :

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre service backend
3. Allez dans **Settings** → **Source**
4. Changez le repository vers : `TheXmyst/sea-dogs-backend`
5. Railway devrait automatiquement détecter le nouveau repo et redéployer

## Structure

- **Frontend (public):** Ce repository (`sea-dogs-island-tycoon`)
- **Backend (privé):** `sea-dogs-backend`

## Développement Local

Pour travailler avec le backend localement :

```bash
# Cloner le repo backend (si pas déjà fait)
git clone git@github.com:TheXmyst/sea-dogs-backend.git backend

# Ou si vous avez déjà le dossier backend
cd backend
git remote set-url origin git@github.com:TheXmyst/sea-dogs-backend.git
```

