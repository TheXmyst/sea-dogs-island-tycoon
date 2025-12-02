# ✅ Vérification Finale - Configuration Vercel + Railway

Après avoir configuré Railway et Vercel, vérifiez que tout fonctionne correctement.

## 🧪 Tests Rapides

### Test 1 : Backend Accessible

Ouvrez dans votre navigateur :
```
https://votre-backend.railway.app/api/health
```

**Résultat attendu** : Un JSON avec le statut de la base de données
```json
{
  "status": "ok",
  "database": {
    "type": "postgresql",
    "connected": true
  }
}
```

✅ **Si vous voyez ça** : Le backend fonctionne !

---

### Test 2 : Frontend Accessible

Ouvrez votre site Vercel :
```
https://votre-app.vercel.app
```

**Résultat attendu** : Votre jeu s'affiche

✅ **Si vous voyez votre jeu** : Le frontend fonctionne !

---

### Test 3 : Communication Frontend ↔ Backend

1. Ouvrez votre site Vercel
2. Ouvrez la console du navigateur (F12)
3. Regardez les messages de la console

**Résultat attendu** : Vous devriez voir :
```
🔧 API Configuration: {
  environment: "production",
  apiUrl: "https://votre-backend.railway.app",
  ...
}
```

✅ **Si vous voyez ça** : La configuration est correcte !

---

### Test 4 : Authentification Fonctionne

1. Sur votre site Vercel, **inscrivez-vous** ou **connectez-vous**
2. Dans la console (F12), tapez :
   ```javascript
   localStorage.getItem('authToken')
   ```

**Résultat attendu** : Un long token JWT (commence par `eyJ...`)

✅ **Si vous voyez un token** : L'authentification fonctionne !

---

### Test 5 : Pas d'Erreurs CORS

Dans la console du navigateur, vérifiez qu'il n'y a **PAS** d'erreurs comme :
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

✅ **Si pas d'erreurs CORS** : La configuration CORS est correcte !

---

### Test 6 : Les Requêtes Incluent le Token

1. Faites une action dans le jeu (construire un bâtiment, etc.)
2. Dans la console, allez dans l'onglet **Network**
3. Cliquez sur une requête vers `/api/game/save`
4. Regardez les **Headers** de la requête

**Résultat attendu** : Vous devriez voir :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Si vous voyez ça** : Les requêtes sont sécurisées !

---

## 🐛 Problèmes Courants

### ❌ Erreur : "CORS policy: No 'Access-Control-Allow-Origin'"

**Cause** : `FRONTEND_URL` sur Railway ne correspond pas à l'URL Vercel

**Solution** :
1. Vérifiez l'URL exacte de votre frontend Vercel
2. Sur Railway, mettez à jour `FRONTEND_URL` avec cette URL exacte
3. Redéployez Railway

---

### ❌ Erreur : "Token d'authentification manquant"

**Cause** : Le token n'est pas stocké ou envoyé

**Solution** :
1. Reconnectez-vous (le token sera régénéré)
2. Vérifiez dans la console : `localStorage.getItem('authToken')`
3. Si toujours vide, vérifiez que `JWT_SECRET` est bien configuré sur Railway

---

### ❌ Erreur : "Cannot connect to backend server"

**Cause** : `VITE_API_URL` n'est pas configuré ou incorrect

**Solution** :
1. Sur Vercel, vérifiez que `VITE_API_URL` est bien configuré
2. Vérifiez que l'URL correspond bien à votre backend Railway
3. Redéployez Vercel après modification

---

### ❌ Le backend ne démarre pas

**Cause** : Variables d'environnement manquantes ou incorrectes

**Solution** :
1. Sur Railway, allez dans **Deployments** → Cliquez sur le déploiement → **View Logs**
2. Vérifiez les erreurs dans les logs
3. Vérifiez que toutes les variables sont bien définies :
   - `JWT_SECRET` (obligatoire)
   - `NODE_ENV=production`
   - `FRONTEND_URL` (peut être vide temporairement)
4. Vérifiez que PostgreSQL est bien connecté

---

## 📋 Checklist de Vérification

### Backend (Railway) ✅
- [ ] `/api/health` retourne un JSON valide
- [ ] Base de données PostgreSQL connectée
- [ ] Pas d'erreurs dans les logs Railway
- [ ] Variables d'environnement configurées

### Frontend (Vercel) ✅
- [ ] Site accessible
- [ ] Console affiche la configuration API
- [ ] Pas d'erreurs CORS
- [ ] Variable `VITE_API_URL` configurée

### Authentification ✅
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Token JWT stocké dans localStorage
- [ ] Requêtes incluent le header Authorization

### Fonctionnalités ✅
- [ ] Sauvegarde du jeu fonctionne
- [ ] Chargement du jeu fonctionne
- [ ] Gacha fonctionne
- [ ] Pas d'erreurs dans la console

---

## 🎉 Si Tout Est Vert

**Félicitations !** Votre application est correctement configurée et sécurisée ! 🚀

Vous pouvez maintenant :
- ✅ Utiliser votre application en production
- ✅ Les utilisateurs peuvent s'inscrire et jouer
- ✅ Les données sont sécurisées avec JWT
- ✅ Le backend est protégé contre les attaques

---

## 📚 Ressources

- **Guide de configuration** : `GUIDE_CONFIGURATION_RAPIDE.md`
- **Documentation sécurité** : `SECURITY_IMPROVEMENTS.md`
- **Guide de déploiement** : `DEPLOYMENT_SECURITY.md`

---

**Besoin d'aide ?** Vérifiez les logs Railway et la console du navigateur pour plus de détails sur les erreurs.

