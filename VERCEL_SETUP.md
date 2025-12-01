# 🔧 Configuration Vercel - Guide rapide

## ⚠️ Problème : "Failed to load from server"

Si vous voyez cette erreur, c'est que `VITE_API_URL` n'est pas configurée sur Vercel.

## ✅ Solution en 3 étapes

### 1. Obtenir l'URL du backend Railway

1. Allez sur https://railway.app
2. Ouvrez votre projet
3. Cliquez sur le service **backend**
4. Allez dans l'onglet **"Settings"**
5. Dans **"Domains"**, copiez l'URL publique
   - Exemple : `https://your-backend.up.railway.app`
   - ⚠️ **IMPORTANT** : Copiez l'URL complète avec `https://`

### 2. Configurer la variable sur Vercel

1. Allez sur https://vercel.com
2. Ouvrez votre projet
3. Allez dans **"Settings"** → **"Environment Variables"**
4. Cliquez sur **"Add New"**
5. Configurez :
   - **Name** : `VITE_API_URL`
   - **Value** : L'URL de votre backend Railway (ex: `https://your-backend.up.railway.app`)
   - ⚠️ **IMPORTANT** : N'ajoutez PAS `/api` à la fin, juste l'URL de base
   - **Environments** : Cochez **toutes les cases** :
     - ☑ Production
     - ☑ Preview  
     - ☑ Development

6. Cliquez sur **"Save"**

### 3. Redéployer le frontend

⚠️ **CRUCIAL** : Après avoir ajouté/modifié une variable d'environnement, vous DEVEZ redéployer !

1. Allez dans l'onglet **"Deployments"**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points** (⋮) à droite
4. Sélectionnez **"Redeploy"**
5. Attendez que le déploiement se termine

## ✅ Vérification

1. Ouvrez votre site Vercel
2. Ouvrez la console du navigateur (F12)
3. Vous devriez voir :
   ```
   🔧 API Configuration: {
     environment: "production",
     apiUrl: "https://your-backend.up.railway.app",
     ...
   }
   ```
4. Connectez-vous
5. L'erreur "Failed to load from server" ne devrait plus apparaître

## 🔍 Dépannage

### Erreur persiste après redéploiement

1. Vérifiez que `VITE_API_URL` est bien définie dans Vercel
2. Vérifiez que l'URL est correcte (sans `/api` à la fin)
3. Vérifiez que vous avez bien redéployé après avoir ajouté la variable
4. Vérifiez les logs Vercel pour voir si le build a réussi

### Backend non accessible

1. Vérifiez que le backend est bien déployé sur Railway
2. Testez l'URL du backend directement : `https://your-backend.up.railway.app/api/health`
3. Vous devriez voir : `{"status":"ok"}`

### CORS errors

Le backend est déjà configuré pour accepter toutes les origines. Si vous avez des erreurs CORS, vérifiez que le backend est bien déployé.

## 📝 Notes importantes

- Les variables `VITE_*` sont **injectées au moment du build**
- Si vous ajoutez une variable après le build, vous **DEVEZ redéployer**
- L'URL doit être accessible publiquement (pas de localhost en production)
- N'ajoutez pas `/api` à la fin de `VITE_API_URL` - le code l'ajoute automatiquement

