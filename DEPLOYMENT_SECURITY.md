# 🚀 Guide de Déploiement Sécurisé - Vercel + Railway

Ce guide explique comment configurer la sécurité pour un déploiement avec :
- **Frontend** : Vercel
- **Backend** : Railway

## 📋 Configuration Requise

### 1. Configuration Railway (Backend)

#### Variables d'Environnement à Configurer

Dans votre projet Railway, allez dans **Variables** et ajoutez :

```env
# JWT Secret (OBLIGATOIRE - générer une clé forte)
JWT_SECRET=votre_clé_secrète_très_longue_et_aléatoire_minimum_32_caractères

# Frontend URL (URL de votre frontend Vercel)
# Format: https://votre-app.vercel.app
# Pour plusieurs domaines, séparer par des virgules: https://app1.vercel.app,https://app2.vercel.app
FRONTEND_URL=https://votre-app.vercel.app

# Environnement
NODE_ENV=production

# Base de données PostgreSQL (automatiquement configuré par Railway si vous avez ajouté PostgreSQL)
# DATABASE_URL est automatiquement fourni par Railway
# Pas besoin de le configurer manuellement
```

#### Génération de la Clé Secrète JWT

```bash
# Sur votre machine locale
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiez le résultat et collez-le dans `JWT_SECRET` sur Railway.

#### Configuration PostgreSQL

1. Dans Railway, ajoutez un service **PostgreSQL**
2. Railway configurera automatiquement `DATABASE_URL`
3. Le backend utilisera automatiquement cette connexion

### 2. Configuration Vercel (Frontend)

#### Variables d'Environnement à Configurer

Dans votre projet Vercel, allez dans **Settings** → **Environment Variables** et ajoutez :

```env
# URL du backend Railway
# Format: https://votre-backend.railway.app
# OU: https://votre-domaine-custom.railway.app (si vous avez configuré un domaine)
VITE_API_URL=https://votre-backend.railway.app
```

⚠️ **IMPORTANT** : 
- Vercel utilise le préfixe `VITE_` pour les variables d'environnement côté client
- Après avoir ajouté/modifié les variables, **redéployez** votre application Vercel

#### Comment Trouver l'URL de votre Backend Railway

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet backend
3. Cliquez sur votre service backend
4. L'URL est affichée dans l'onglet **Settings** → **Networking**
5. Format typique : `https://votre-service-production.up.railway.app`

### 3. Configuration CORS

Le backend est configuré pour accepter les requêtes depuis Vercel. La configuration CORS :

- ✅ **En développement** : Accepte toutes les origines
- ✅ **En production** : Accepte uniquement les URLs spécifiées dans `FRONTEND_URL`

#### Support de Plusieurs Domaines

Si vous avez plusieurs domaines Vercel (ex: preview deployments), vous pouvez les séparer par des virgules :

```env
FRONTEND_URL=https://app.vercel.app,https://app-git-main.vercel.app,https://votre-domaine.com
```

#### Support des Wildcards (Vercel Preview)

Pour accepter tous les preview deployments Vercel automatiquement :

```env
FRONTEND_URL=https://*.vercel.app,https://votre-domaine.com
```

## 🔐 Vérification de la Configuration

### Test 1: Vérifier que le Backend est Accessible

```bash
# Remplacer par votre URL Railway
curl https://votre-backend.railway.app/api/health
```

Vous devriez recevoir une réponse JSON avec le statut de la base de données.

### Test 2: Vérifier CORS depuis le Frontend

Ouvrez la console du navigateur sur votre site Vercel et vérifiez :

```javascript
// Devrait fonctionner sans erreur CORS
fetch('https://votre-backend.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test 3: Vérifier l'Authentification

1. Inscrivez-vous sur votre site Vercel
2. Vérifiez dans la console du navigateur que le token JWT est stocké :
   ```javascript
   localStorage.getItem('authToken')
   ```
3. Vérifiez que les requêtes incluent le header Authorization :
   - Ouvrez les DevTools → Network
   - Faites une action qui sauvegarde le jeu
   - Vérifiez que la requête vers `/api/game/save` inclut `Authorization: Bearer <token>`

## 🐛 Dépannage

### Erreur: "CORS policy: No 'Access-Control-Allow-Origin'"

**Cause** : `FRONTEND_URL` sur Railway ne correspond pas à l'URL de votre frontend Vercel.

**Solution** :
1. Vérifiez l'URL exacte de votre frontend Vercel (avec ou sans `www`)
2. Mettez à jour `FRONTEND_URL` sur Railway avec l'URL exacte
3. Redéployez le backend sur Railway

### Erreur: "Token d'authentification manquant"

**Cause** : Le frontend n'envoie pas le token JWT.

**Solution** :
1. Vérifiez que l'utilisateur est bien connecté
2. Vérifiez dans la console : `localStorage.getItem('authToken')`
3. Si le token est absent, reconnectez-vous

### Erreur: "Cannot connect to backend server"

**Cause** : `VITE_API_URL` n'est pas configuré sur Vercel ou l'URL est incorrecte.

**Solution** :
1. Vérifiez que `VITE_API_URL` est bien configuré dans Vercel
2. Vérifiez que l'URL correspond bien à votre backend Railway
3. Redéployez le frontend sur Vercel après modification

### Erreur: "JWT_SECRET non configuré"

**Cause** : `JWT_SECRET` n'est pas défini sur Railway.

**Solution** :
1. Générez une clé secrète (voir section ci-dessus)
2. Ajoutez-la dans les variables d'environnement Railway
3. Redéployez le backend

## 📝 Checklist de Déploiement

### Backend (Railway)
- [ ] Service PostgreSQL ajouté
- [ ] `JWT_SECRET` configuré (clé forte générée)
- [ ] `FRONTEND_URL` configuré avec l'URL Vercel exacte
- [ ] `NODE_ENV=production` configuré
- [ ] Backend déployé et accessible via l'URL Railway
- [ ] Test `/api/health` fonctionne

### Frontend (Vercel)
- [ ] `VITE_API_URL` configuré avec l'URL Railway
- [ ] Frontend redéployé après configuration des variables
- [ ] Test de connexion fonctionne
- [ ] Test d'inscription fonctionne
- [ ] Test de sauvegarde fonctionne

## 🔄 Mise à Jour des Variables

### Changer l'URL du Backend

1. **Railway** : Mettez à jour l'URL dans les settings si vous avez changé de domaine
2. **Vercel** : Mettez à jour `VITE_API_URL` avec la nouvelle URL
3. **Redéployez** les deux services

### Changer le JWT Secret

⚠️ **ATTENTION** : Changer le JWT_SECRET invalidera tous les tokens existants. Les utilisateurs devront se reconnecter.

1. Générez une nouvelle clé secrète
2. Mettez à jour `JWT_SECRET` sur Railway
3. Redéployez le backend

## 🎯 URLs Typiques

### Railway
- Production : `https://votre-service-production.up.railway.app`
- Custom domain : `https://api.votre-domaine.com`

### Vercel
- Production : `https://votre-app.vercel.app`
- Preview : `https://votre-app-git-branch.vercel.app`
- Custom domain : `https://votre-domaine.com`

## 📚 Ressources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Dernière mise à jour** : $(date)

