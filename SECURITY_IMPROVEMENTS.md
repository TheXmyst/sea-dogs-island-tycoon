# 🔒 Améliorations de Sécurité - Backend

Ce document décrit les améliorations de sécurité apportées au serveur backend.

## ✅ Changements Implémentés

### 1. **Hachage des Mots de Passe avec bcrypt**
- ✅ **Avant** : Mots de passe stockés en clair dans la base de données
- ✅ **Après** : Mots de passe hashés avec bcrypt (10 rounds de salt)
- ✅ **Impact** : Protection contre les fuites de données et les attaques par dictionnaire

**Fichiers modifiés :**
- `backend/server.js` : Routes `/api/players/register` et `/api/players/login`

### 2. **Authentification JWT**
- ✅ **Avant** : Aucune authentification, routes accessibles à tous
- ✅ **Après** : Système JWT complet avec tokens valides 7 jours
- ✅ **Impact** : Seuls les utilisateurs authentifiés peuvent accéder aux routes protégées

**Fichiers créés :**
- `backend/middleware/auth.js` : Middleware d'authentification JWT

**Fichiers modifiés :**
- `backend/server.js` : Routes d'inscription et de connexion retournent maintenant un token JWT

### 3. **Protection des Routes API**
- ✅ **Routes protégées** :
  - `/api/game/save/:playerId` - Sauvegarde du jeu
  - `/api/game/load/:playerId` - Chargement du jeu
  - `/api/gacha/pull` - Système de gacha
  - `/api/islands/:playerId` - Informations de l'île
  - `/api/captains/:playerId` - Liste des capitaines
  - `/api/leaderboard/rank/:playerId` - Classement du joueur
  - `/api/sea/assign/:playerId` - Attribution de mer
  - `/api/debug/update-building-position` - Route de debug (désactivée en production)

- ✅ **Vérification de propriété** : Les utilisateurs ne peuvent accéder qu'à leurs propres données

**Fichiers modifiés :**
- `backend/server.js` : Ajout de `authenticateToken` et `verifyOwnership` sur les routes sensibles

### 4. **Rate Limiting Global**
- ✅ **Avant** : Rate limiting uniquement sur l'inscription
- ✅ **Après** : Rate limiting global (100 requêtes/minute par IP) sur toutes les routes API
- ✅ **Impact** : Protection contre les attaques DoS et les abus

**Fichiers créés :**
- `backend/middleware/rateLimiter.js` : Middleware de rate limiting réutilisable

**Fichiers modifiés :**
- `backend/server.js` : Rate limiting appliqué à toutes les routes `/api/*`

### 5. **Configuration CORS Sécurisée pour Vercel + Railway**
- ✅ **Avant** : CORS ouvert à toutes les origines (`*`) même en production
- ✅ **Après** : 
  - En développement : Toutes les origines autorisées
  - En production : Validation dynamique des origines avec support de :
    - URLs exactes (ex: `https://app.vercel.app`)
    - Plusieurs domaines séparés par des virgules
    - Wildcards pour Vercel preview (ex: `https://*.vercel.app`)
- ✅ **Impact** : Protection contre les attaques CSRF tout en supportant les déploiements Vercel

**Fichiers modifiés :**
- `backend/server.js` : Configuration CORS intelligente avec validation d'origine dynamique

### 6. **Limitation de Taille des Requêtes**
- ✅ **Ajout** : Limite de 10MB pour le body JSON
- ✅ **Impact** : Protection contre les attaques DoS par requêtes volumineuses

**Fichiers modifiés :**
- `backend/server.js` : `express.json({ limit: '10mb' })`

### 7. **Validation des Entrées**
- ✅ **Déjà présent** : Validation des usernames, emails, mots de passe
- ✅ **Amélioré** : Messages d'erreur en français pour une meilleure UX

## 📋 Configuration Requise

### Variables d'Environnement

Mettre à jour votre fichier `backend/.env` avec :

```env
# JWT Secret (OBLIGATOIRE - minimum 32 caractères)
# Générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=votre_clé_secrète_très_longue_et_aléatoire

# Frontend URL (pour CORS en production)
# En développement, laisser vide
# En production: https://votre-app.vercel.app
FRONTEND_URL=

# Environnement
NODE_ENV=production
```

### Génération d'une Clé Secrète JWT

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔄 Migration des Mots de Passe Existants

⚠️ **IMPORTANT** : Les mots de passe existants en clair dans la base de données ne fonctionneront plus.

**Options de migration :**

1. **Réinitialisation forcée** : Demander aux utilisateurs de réinitialiser leurs mots de passe
2. **Migration automatique** : Créer un script de migration qui hash les mots de passe existants au premier login

**Script de migration recommandé :**
```javascript
// backend/scripts/migrate-passwords.js
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migratePasswords() {
  const result = await pool.query('SELECT id, password_hash FROM players');
  
  for (const player of result.rows) {
    // Si le hash ne commence pas par $2b$ (format bcrypt), c'est un ancien mot de passe en clair
    if (!player.password_hash.startsWith('$2b$')) {
      const hashed = await bcrypt.hash(player.password_hash, 10);
      await pool.query('UPDATE players SET password_hash = $1 WHERE id = $2', [hashed, player.id]);
      console.log(`Migrated password for player ${player.id}`);
    }
  }
  
  await pool.end();
}

migratePasswords();
```

## 🚀 Routes Publiques vs Protégées

### Routes Publiques (pas d'authentification requise)
- `GET /api/health` - Health check
- `POST /api/players/register` - Inscription (avec rate limiting)
- `POST /api/players/login` - Connexion (avec rate limiting)
- `GET /api/leaderboard/top` - Top du classement

### Routes Protégées (authentification JWT requise)
- `GET /api/game/load/:playerId` - Charger le jeu
- `POST /api/game/save/:playerId` - Sauvegarder le jeu
- `POST /api/gacha/pull` - Effectuer un tirage gacha
- `GET /api/islands/:playerId` - Informations de l'île
- `GET /api/captains/:playerId` - Liste des capitaines
- `GET /api/leaderboard/rank/:playerId` - Classement du joueur
- `POST /api/sea/assign/:playerId` - Attribution de mer

## 🔐 Utilisation du Token JWT

### Côté Frontend

Après l'inscription ou la connexion, le serveur retourne un token :

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 123,
  "username": "joueur1",
  ...
}
```

**Envoyer le token dans les requêtes :**
```javascript
fetch('/api/game/save/123', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // Format: "Bearer TOKEN"
  },
  body: JSON.stringify(gameState)
});
```

## ⚠️ Points d'Attention

1. **JWT_SECRET** : Doit être une clé forte et unique. Ne jamais la commiter dans Git.
2. **Expiration des tokens** : Actuellement 7 jours. Peut être ajusté selon les besoins.
3. **Rate limiting** : Les limites peuvent être ajustées dans `middleware/rateLimiter.js`
4. **CORS** : En production, toujours spécifier `FRONTEND_URL` pour restreindre les origines.

## 📝 Améliorations Futures Recommandées

1. **Helmet.js** : Ajouter helmet pour sécuriser les headers HTTP
   ```bash
   npm install helmet
   ```
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

2. **HTTPS** : Forcer HTTPS en production

3. **Logging des Tentatives Échouées** : Logger les tentatives de connexion échouées pour détecter les attaques

4. **Refresh Tokens** : Implémenter un système de refresh tokens pour une meilleure sécurité

5. **2FA** : Ajouter l'authentification à deux facteurs pour les comptes sensibles

6. **Validation Avancée** : Utiliser une bibliothèque comme `joi` ou `zod` pour une validation plus robuste

## 🧪 Tests de Sécurité

Pour tester la sécurité :

1. **Test d'authentification** :
   ```bash
   # Sans token - doit échouer
   curl http://localhost:5000/api/game/load/123
   
   # Avec token - doit réussir
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/game/load/123
   ```

2. **Test de propriété** :
   ```bash
   # Tenter d'accéder aux données d'un autre joueur - doit échouer
   curl -H "Authorization: Bearer TOKEN_USER_1" http://localhost:5000/api/game/load/999
   ```

3. **Test de rate limiting** :
   ```bash
   # Faire plus de 100 requêtes en 1 minute - doit être bloqué
   for i in {1..101}; do curl http://localhost:5000/api/health; done
   ```

## 📚 Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

---

**Date de mise à jour** : $(date)
**Version** : 1.0.0

