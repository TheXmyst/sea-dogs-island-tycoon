# 🌊 Guide de Test - Système d'Océan Multi-Cartes

## 📋 Prérequis

1. ✅ Backend déployé sur Railway avec PostgreSQL
2. ✅ Frontend déployé sur Vercel (ou en local)
3. ✅ Base de données PostgreSQL accessible

## 🔧 Étape 1 : Appliquer la Migration SQL

### Option A : Via Railway Dashboard (Recommandé)

1. Allez sur votre projet Railway
2. Cliquez sur votre service PostgreSQL
3. Allez dans l'onglet **"Data"** ou **"Query"**
4. Copiez-collez le contenu de `backend/migrations/add_sea_system.sql`
5. Exécutez la requête

### Option B : Via psql (Local ou Railway CLI)

```bash
# Si vous avez Railway CLI installé
railway run psql < backend/migrations/add_sea_system.sql

# Ou via psql directement (si vous avez les credentials)
psql $DATABASE_URL < backend/migrations/add_sea_system.sql
```

### Option C : Via le Backend (Automatique)

Le backend appliquera automatiquement les migrations au démarrage si vous ajoutez cette fonctionnalité.

## ✅ Vérification de la Migration

Vérifiez que les tables ont été créées :

```sql
-- Vérifier que la table seas existe
SELECT * FROM seas LIMIT 1;

-- Vérifier que les colonnes ont été ajoutées à players
SELECT sea_id, island_position_x, island_position_y FROM players LIMIT 1;

-- Vérifier que la table sea_events existe
SELECT * FROM sea_events LIMIT 1;
```

## 🧪 Étape 2 : Tests

### Test 1 : Inscription d'un Nouveau Joueur

1. Créez un nouveau compte dans le jeu
2. Le joueur devrait être automatiquement assigné à une mer
3. Vérifiez dans la console du backend qu'un message apparaît :
   ```
   ✅ Player assigned to sea X
   ```

### Test 2 : Affichage de la Carte de Mer

1. Connectez-vous au jeu
2. Cliquez sur l'onglet **"Sea"** (🌊) dans la navigation
3. Vous devriez voir :
   - Votre île positionnée sur la carte
   - D'autres îles si d'autres joueurs sont dans la même mer
   - Un fond bleu océan

### Test 3 : Assignation à une Mer Existante

1. Créez un deuxième compte
2. Ce joueur devrait être assigné à la même mer que le premier (si la mer n'est pas pleine)
3. Les deux îles devraient apparaître sur la même carte

### Test 4 : Création d'une Nouvelle Mer

1. Créez 50 comptes (ou modifiez temporairement `max_islands` à 2 pour tester)
2. Le 51ème joueur devrait être assigné à une nouvelle mer

## 🐛 Dépannage

### Erreur : "Sea system requires PostgreSQL"

**Cause** : Le backend utilise la base de données en mémoire.

**Solution** : Vérifiez que PostgreSQL est bien configuré sur Railway et que les variables d'environnement sont définies.

### Erreur : "Failed to assign sea"

**Cause** : La migration n'a pas été appliquée.

**Solution** : Appliquez la migration SQL (voir Étape 1).

### Erreur : "Failed to load sea map"

**Cause** : Le joueur n'a pas de `sea_id` assigné.

**Solution** : 
1. Vérifiez dans la base de données : `SELECT sea_id FROM players WHERE id = YOUR_PLAYER_ID;`
2. Si `NULL`, appelez manuellement l'API : `POST /api/sea/assign/YOUR_PLAYER_ID`

### La carte ne s'affiche pas

**Vérifications** :
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs réseau
3. Vérifiez que l'API répond : `GET /api/sea/map/SEA_ID`

## 📊 Endpoints API à Tester

### 1. Assigner un joueur à une mer
```bash
POST /api/sea/assign/:playerId
```

### 2. Récupérer la carte d'une mer
```bash
GET /api/sea/map/:seaId
```

### 3. Calculer une distance
```bash
POST /api/sea/distance
Body: { "x1": 100, "y1": 200, "x2": 300, "y2": 400 }
```

## 🎯 Prochaines Étapes Après les Tests

Une fois les tests réussis :
1. ✅ Ajouter les assets d'océan (images de fond)
2. ✅ Implémenter la navigation complète vers les événements
3. ✅ Créer un système de spawn d'événements PvP/PvE
4. ✅ Ajouter le drag & drop pour déplacer la vue

## 📝 Notes

- Les positions des îles sont générées aléatoirement entre 0 et 1000
- Chaque mer peut contenir jusqu'à 50 îles
- Les joueurs sont assignés automatiquement lors de l'inscription
- La carte est centrée automatiquement sur votre île au chargement

