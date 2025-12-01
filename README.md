# 🏴‍☠️ Sea Dogs: Island Tycoon

Un jeu de stratégie et de construction d'île en navigateur avec un univers de pirates stylisé.

## 🎮 Description

**Sea Dogs: Island Tycoon** est un jeu MMO léger où vous construisez et gérez votre île pirate. Collectez des ressources, construisez des bâtiments, recrutez des capitaines, construisez une flotte et participez à des batailles PvE.

### Fonctionnalités principales

- 🏝️ **Gestion d'île** : Construisez et améliorez des bâtiments sur votre île
- ⚓ **Flotte** : Construisez et gérez vos navires (Sloop, Brigantine, Galleon)
- ⭐ **Capitaines** : Collectez des capitaines avec des buffs uniques
- 🔬 **Technologies** : Recherchez des technologies pour débloquer de nouveaux contenus
- ⚔️ **Combat PvE** : Participez à des batailles asynchrones
- 💎 **Système Gacha** : Recrutez des capitaines avec des diamants/fragments
- 🎨 **Skins** : Personnalisez vos capitaines avec des skins
- 📊 **Progression hors ligne** : Les timers continuent même quand vous êtes déconnecté

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- PostgreSQL (optionnel, fallback en mémoire disponible)

### Installation

```bash
# Cloner le repository
git clone https://github.com/TheXmyst/sea-dogs-island-tycoon.git
cd sea-dogs-island-tycoon

# Installer les dépendances frontend
npm install

# Installer les dépendances backend
cd backend
npm install
cd ..
```

### Configuration

1. **Backend** : Créer un fichier `backend/.env` :
```env
PORT=5000
NODE_ENV=development

# PostgreSQL (optionnel)
PGHOST=localhost
PGDATABASE=seadogs
PGUSER=postgres
PGPASSWORD=your_password
PGPORT=5432
```

2. **Frontend** : Créer un fichier `.env` :
```env
VITE_API_URL=http://localhost:5000
```

### Lancer le projet

```bash
# Terminal 1 : Backend
cd backend
npm start

# Terminal 2 : Frontend
npm run dev
```

Le jeu sera accessible sur `http://localhost:3000`

## 🏗️ Architecture

### Frontend
- **React 18** avec Vite
- **Architecture modulaire** : Composants séparés par fonctionnalité
- **State management** : React Hooks (useState, useEffect)
- **Persistence** : localStorage + API backend
- **Taille du bundle** : ~82 kB gzippé (excellent pour un jeu navigateur)

### Backend
- **Node.js + Express**
- **Base de données** : PostgreSQL (avec fallback en mémoire)
- **API REST** : Endpoints pour authentification, sauvegarde, chargement
- **Système de sauvegarde** : Temps réel (MMO)

### Structure des dossiers

```
├── src/
│   ├── components/     # Composants React
│   ├── config/         # Configuration (bâtiments, navires, technologies)
│   ├── services/       # API client
│   └── utils/          # Utilitaires (gameState, buffs, etc.)
├── backend/
│   ├── migrations/     # Scripts SQL
│   └── server.js       # Serveur Express
└── public/             # Assets statiques
```

## 🎯 Système de jeu

### Ressources
- **Or** : Ressource principale
- **Bois** : Pour constructions
- **Rhum** : Pour recrutement
- **Pierre** : Pour constructions avancées
- **Nourriture** : Pour équipage
- **Équipage** : Pour navires
- **Canons** : Pour combat
- **Diamants** : Monnaie premium
- **Fragments** : Pour recrutement de capitaines

### Bâtiments
- **Town Hall** : Bâtiment principal, débloque les niveaux
- **Gold Mine** : Produit de l'or
- **Lumber Mill** : Produit du bois
- **Quarry** : Produit de la pierre
- **Distillery** : Produit du rhum
- **Tavern** : Recrute de l'équipage
- **Dock** : Construit des navires (nécessite technologie Shipbuilding)

### Technologies
- **3 branches** : Économie, Militaire, Exploration
- **Niveaux** : Chaque technologie peut monter jusqu'au niveau 10
- **Effets** : Bonus de production, stats de navires, loot, etc.

### Navires
- **Sloop** : Rapide, faible HP
- **Brigantine** : Équilibré
- **Galleon** : Lent, très résistant

### Capitaines
- **Raretés** : Common, Rare, Epic, Legendary
- **Rôles** : Combat, Économie, Exploration, Support, Commerce
- **Buffs** : Bonus modérés (pas de P2W)
- **Skins** : Cosmétiques uniquement

## 💾 Système de sauvegarde

### Sauvegarde en temps réel (MMO)
- ✅ Sauvegarde immédiate après chaque action
- ✅ Sauvegarde périodique toutes les 30 secondes
- ✅ Sauvegarde avant fermeture de page
- ✅ Progression hors ligne : Les timers continuent même déconnecté

### Stockage
- **localStorage** : Backup local instantané
- **PostgreSQL** : Sauvegarde persistante sur serveur

## 🚢 Déploiement

### Frontend (Vercel)
1. Connecter le repository GitHub à Vercel
2. Configurer la variable d'environnement `VITE_API_URL` avec l'URL du backend
3. Déploiement automatique à chaque push

### Backend (Railway)
1. Connecter le repository GitHub à Railway
2. Ajouter un service PostgreSQL
3. Lier les variables PostgreSQL au service backend
4. Déploiement automatique à chaque push

## 🛠️ Technologies utilisées

- **Frontend** : React 18, Vite, CSS Variables
- **Backend** : Node.js, Express, PostgreSQL
- **Déploiement** : Vercel (frontend), Railway (backend)
- **Base de données** : PostgreSQL

## 📝 Notes de développement

- Architecture modulaire et extensible
- Code commenté et propre
- Pas d'assets copyrightés
- Optimisé pour mobile
- Bundle léger (~82 kB gzippé)

## 📄 Licence

Ce projet est un prototype de jeu. Tous les droits réservés.

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont les bienvenues !

---

**Version** : 1.0.0  
**Dernière mise à jour** : Voir `UPDATE.md`
