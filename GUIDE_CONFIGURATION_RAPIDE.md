# ⚡ Guide de Configuration Rapide - Vercel + Railway

Guide étape par étape pour configurer votre application après la sécurisation du backend.

## 🚂 ÉTAPE 1 : Configuration Railway (Backend)

### 1.1 Trouver l'URL de votre backend Railway

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet
3. Cliquez sur votre service backend
4. Allez dans l'onglet **Settings** → **Networking**
5. **Copiez l'URL** (format : `https://votre-service-production.up.railway.app`)
   - ⚠️ **GARDEZ CETTE URL**, vous en aurez besoin pour Vercel !

### 1.2 Générer la clé secrète JWT

Sur votre machine locale, exécutez :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copiez le résultat** (une longue chaîne de caractères hexadécimaux)

### 1.3 Configurer les variables d'environnement sur Railway

1. Dans Railway, allez dans votre service backend
2. Cliquez sur l'onglet **Variables**
3. Cliquez sur **+ New Variable** et ajoutez :

#### Variable 1 : JWT_SECRET
- **Nom** : `JWT_SECRET`
- **Valeur** : Collez la clé générée à l'étape 1.2
- ✅ Cliquez sur **Add**

#### Variable 2 : FRONTEND_URL
- **Nom** : `FRONTEND_URL`
- **Valeur** : L'URL de votre frontend Vercel
  - Si vous ne connaissez pas encore l'URL Vercel, vous pouvez :
    - Soit attendre de la connaître (étape 2.1)
    - Soit utiliser un wildcard : `https://*.vercel.app` (acceptera tous les previews Vercel)
- ✅ Cliquez sur **Add**

#### Variable 3 : NODE_ENV
- **Nom** : `NODE_ENV`
- **Valeur** : `production`
- ✅ Cliquez sur **Add**

### 1.4 Vérifier PostgreSQL

1. Vérifiez que vous avez un service **PostgreSQL** dans votre projet Railway
2. Si non, ajoutez-le : **+ New** → **Database** → **Add PostgreSQL**
3. Railway configurera automatiquement `DATABASE_URL` - vous n'avez rien à faire !

### 1.5 Redéployer le backend

1. Railway redéploie automatiquement quand vous modifiez les variables
2. Si ce n'est pas le cas, allez dans **Settings** → **Deploy** → **Redeploy**

### 1.6 Tester le backend

Ouvrez dans votre navigateur :
```
https://votre-backend.railway.app/api/health
```

Vous devriez voir un JSON avec le statut de la base de données.

---

## 🎨 ÉTAPE 2 : Configuration Vercel (Frontend)

### 2.1 Trouver l'URL de votre frontend Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com)
2. Sélectionnez votre projet
3. L'URL est affichée en haut (format : `https://votre-app.vercel.app`)
4. **Copiez cette URL** - vous en aurez besoin pour Railway !

### 2.2 Configurer la variable d'environnement sur Vercel

1. Dans Vercel, allez dans votre projet
2. Cliquez sur **Settings** (en haut)
3. Allez dans **Environment Variables** (menu de gauche)
4. Cliquez sur **Add New**

#### Variable : VITE_API_URL
- **Key** : `VITE_API_URL`
- **Value** : L'URL de votre backend Railway (de l'étape 1.1)
  - Format : `https://votre-backend.railway.app`
  - ⚠️ **SANS** le `/api` à la fin !
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- ✅ Cliquez sur **Save**

### 2.3 Redéployer le frontend

1. Allez dans l'onglet **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**
4. Ou faites un nouveau commit et push (Vercel redéploiera automatiquement)

---

## 🔄 ÉTAPE 3 : Mettre à jour Railway avec l'URL Vercel

Maintenant que vous connaissez l'URL Vercel :

1. Retournez sur Railway
2. Allez dans **Variables**
3. Modifiez la variable `FRONTEND_URL`
4. Mettez l'URL exacte de Vercel : `https://votre-app.vercel.app`
5. Railway redéploiera automatiquement

---

## ✅ ÉTAPE 4 : Vérification

### Test 1 : Backend accessible
```bash
curl https://votre-backend.railway.app/api/health
```
Devrait retourner un JSON avec le statut.

### Test 2 : Frontend peut communiquer avec le backend

1. Ouvrez votre site Vercel dans le navigateur
2. Ouvrez la console du navigateur (F12)
3. Vous devriez voir : `🔧 API Configuration:` avec l'URL du backend
4. Inscrivez-vous ou connectez-vous
5. Vérifiez qu'il n'y a pas d'erreurs CORS dans la console

### Test 3 : Authentification fonctionne

1. Inscrivez-vous sur votre site
2. Vérifiez dans la console : `localStorage.getItem('authToken')` devrait retourner un token
3. Faites une action (construire un bâtiment, etc.)
4. Vérifiez dans l'onglet Network que les requêtes incluent `Authorization: Bearer <token>`

---

## 🐛 Dépannage Rapide

### Erreur : "CORS policy: No 'Access-Control-Allow-Origin'"

**Solution** :
1. Vérifiez que `FRONTEND_URL` sur Railway correspond **exactement** à l'URL Vercel
2. Redéployez Railway après modification

### Erreur : "Token d'authentification manquant"

**Solution** :
1. Vérifiez que `JWT_SECRET` est bien configuré sur Railway
2. Reconnectez-vous (le token sera régénéré)

### Erreur : "Cannot connect to backend server"

**Solution** :
1. Vérifiez que `VITE_API_URL` est bien configuré sur Vercel
2. Vérifiez que l'URL correspond bien à votre backend Railway
3. Redéployez Vercel après modification

### Le backend ne démarre pas

**Solution** :
1. Vérifiez les logs Railway : **Deployments** → Cliquez sur le déploiement → **View Logs**
2. Vérifiez que toutes les variables sont bien définies
3. Vérifiez que PostgreSQL est bien connecté

---

## 📋 Checklist Finale

### Railway ✅
- [ ] URL backend copiée
- [ ] JWT_SECRET généré et configuré
- [ ] FRONTEND_URL configuré avec l'URL Vercel
- [ ] NODE_ENV=production configuré
- [ ] PostgreSQL ajouté et connecté
- [ ] Backend redéployé
- [ ] Test `/api/health` fonctionne

### Vercel ✅
- [ ] URL frontend copiée
- [ ] VITE_API_URL configuré avec l'URL Railway
- [ ] Frontend redéployé
- [ ] Test d'inscription fonctionne
- [ ] Test de connexion fonctionne
- [ ] Pas d'erreurs CORS dans la console

---

## 🎯 URLs à Noter

**Backend Railway** : `https://____________________.railway.app`  
**Frontend Vercel** : `https://____________________.vercel.app`

---

**Besoin d'aide ?** Consultez `DEPLOYMENT_SECURITY.md` pour plus de détails.

