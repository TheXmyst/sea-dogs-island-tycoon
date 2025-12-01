# 📝 Journal des mises à jour

## 🎯 Dernières modifications

### ✅ Système de progression hors ligne (MMO)
- Les timers continuent même quand le joueur est déconnecté
- Génération automatique des ressources pendant la déconnexion
- Complétion automatique des constructions/recherches au retour
- Utilisation de `lastUpdate` pour calculer le temps écoulé

### ✅ Sauvegarde en temps réel
- Sauvegarde immédiate après chaque action (construction, upgrade, recherche, etc.)
- Sauvegarde périodique toutes les 30 secondes
- Sauvegarde avant fermeture de page (beforeunload)
- Compatible MMO

### ✅ Améliorations UI/UX
- Système de toasts amélioré : un seul à la fois, disparition après 5s
- Onglet "Système" : historique des notifications avec filtres
- Limitation des constructions : un seul bâtiment à la fois
- Limitation des recherches : une seule technologie à la fois
- Musique continue sur plusieurs onglets (Island, Fleet, Tech, Crew, Captains, Event, Alliance, Leaderboard, System)

### ✅ Corrections de bugs
- Parsing des technologies corrigé (gestion des underscores dans les IDs)
- Déblocage du dock corrigé (nécessite technologie Shipbuilding niveau 1)
- Niveaux de technologies : progression correcte après recherche
- Affichage des bonus de technologies dans les modales de bâtiments

### ✅ Système de niveaux
- Technologies : jusqu'au niveau 10 avec coûts et temps évolutifs
- Bâtiments : jusqu'au niveau 30 avec coûts et temps évolutifs
- Effets scalés selon le niveau

### ✅ Base de données PostgreSQL
- Configuration complète sur Railway
- Sauvegarde de tous les états de jeu
- Migration automatique des colonnes
- Persistance garantie même après redéploiement

---

## 📊 Statistiques du projet

- **Taille du bundle** : 82 kB gzippé (excellent)
- **Technologies** : React 18, Node.js, Express, PostgreSQL
- **Déploiement** : Vercel (frontend) + Railway (backend)
- **Architecture** : Modulaire et extensible

---

*Ce fichier est mis à jour régulièrement avec les dernières modifications.*

