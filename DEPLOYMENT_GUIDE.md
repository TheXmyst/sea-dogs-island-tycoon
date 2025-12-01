# 🚀 Guide de déploiement - Sea Dogs Island Tycoon

## 📋 Prérequis

1. ✅ Projet poussé sur GitHub (déjà fait)
2. Compte Railway (pour le backend + PostgreSQL)
3. Compte Vercel (pour le frontend)

---

## 🔧 Étape 1 : Déployer le Backend sur Railway

### 1.1 Créer un projet Railway

1. Allez sur https://railway.app
2. Connectez-vous avec GitHub
3. Cliquez sur **"New Project"**
4. Sélectionnez **"Deploy from GitHub repo"**
5. Choisissez le dépôt `sea-dogs-island-tycoon`

### 1.2 Configurer le service Backend

1. Railway devrait détecter automatiquement le dossier `backend/`
2. Si ce n'est pas le cas :
   - Cliquez sur **"+ New"** → **"GitHub Repo"**
   - Sélectionnez votre repo
   - Dans **"Root Directory"**, entrez : `backend`
   - Dans **"Start Command"**, entrez : `npm start`

### 1.3 Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"Add PostgreSQL"**
3. Railway créera automatiquement une base PostgreSQL
4. Railway ajoutera automatiquement les variables d'environnement :
   - `DATABASE_URL`
   - `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGPORT`

### 1.4 Vérifier les variables d'environnement

1. Cliquez sur votre service backend
2. Allez dans l'onglet **"Variables"**
3. Vérifiez que ces variables sont présentes :
   - `DATABASE_URL` (ajouté automatiquement par Railway)
   - Ou les variables individuelles : `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`

### 1.5 Obtenir l'URL du backend

1. Cliquez sur votre service backend
2. Allez dans l'onglet **"Settings"**
3. Dans **"Domains"**, vous verrez l'URL publique (ex: `https://your-backend.up.railway.app`)
4. **Copiez cette URL** - vous en aurez besoin pour Vercel

---

## 🎨 Étape 2 : Déployer le Frontend sur Vercel

### 2.1 Créer un projet Vercel

1. Allez sur https://vercel.com
2. Connectez-vous avec GitHub
3. Cliquez sur **"Add New..."** → **"Project"**
4. Importez le dépôt `sea-dogs-island-tycoon`

### 2.2 Configurer le projet

1. **Framework Preset** : Vite (détecté automatiquement)
2. **Root Directory** : `.` (racine du projet)
3. **Build Command** : `npm run build`
4. **Output Directory** : `dist`
5. **Install Command** : `npm install`

### 2.3 ⚠️ IMPORTANT : Configurer la variable d'environnement

1. Avant de déployer, cliquez sur **"Environment Variables"**
2. Ajoutez une nouvelle variable :
   - **Name** : `VITE_API_URL`
   - **Value** : L'URL de votre backend Railway (ex: `https://your-backend.up.railway.app`)
   - **Environments** : Cochez toutes les cases (Production, Preview, Development)

### 2.4 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez que le déploiement se termine
3. Vercel vous donnera une URL (ex: `https://your-app.vercel.app`)

---

## ✅ Vérification

### Vérifier que le backend fonctionne

1. Ouvrez l'URL de votre backend Railway dans le navigateur
2. Ajoutez `/api/health` à la fin de l'URL
3. Vous devriez voir : `{"status":"ok"}`

### Vérifier que le frontend se connecte

1. Ouvrez l'URL de votre frontend Vercel
2. Ouvrez la console du navigateur (F12)
3. Connectez-vous
4. Vous ne devriez **PAS** voir l'erreur "Failed to load from server"
5. Les logs devraient montrer : `✅ Loaded game state from server`

---

## 🔍 Dépannage

### Erreur : "Failed to load from server"

**Cause** : La variable `VITE_API_URL` n'est pas configurée ou incorrecte

**Solution** :
1. Allez sur Vercel → Votre projet → Settings → Environment Variables
2. Vérifiez que `VITE_API_URL` est définie avec l'URL correcte du backend Railway
3. **Important** : Après avoir modifié les variables d'environnement, vous devez **redéployer** le projet
4. Allez dans "Deployments" → Cliquez sur les 3 points → "Redeploy"

### Erreur : CORS

**Cause** : Le backend n'accepte pas les requêtes depuis Vercel

**Solution** : Le backend est déjà configuré pour accepter toutes les origines. Si le problème persiste, vérifiez que le backend est bien déployé.

### Erreur : "Database not available"

**Cause** : PostgreSQL n'est pas connecté sur Railway

**Solution** :
1. Vérifiez que PostgreSQL est bien ajouté dans Railway
2. Vérifiez que les variables d'environnement sont bien définies dans le service backend
3. Redéployez le backend après avoir ajouté PostgreSQL

---

## 📝 Notes importantes

- ⚠️ **Variables d'environnement** : Les variables `VITE_*` doivent être définies **avant** le build. Si vous les ajoutez après, vous devez redéployer.

- 🔄 **Redéploiement** : Après chaque modification des variables d'environnement sur Vercel, vous devez redéployer manuellement.

- 🔐 **Sécurité** : Ne partagez jamais vos variables d'environnement publiquement. Elles sont automatiquement masquées dans les logs.

- 💾 **Base de données** : Sur Railway, PostgreSQL persiste automatiquement. Vous n'avez rien à configurer de plus.

---

## 🎉 C'est tout !

Une fois ces étapes terminées, votre jeu devrait être accessible en ligne avec :
- ✅ Sauvegarde persistante (PostgreSQL)
- ✅ Connexion frontend ↔ backend
- ✅ Toutes les fonctionnalités opérationnelles

