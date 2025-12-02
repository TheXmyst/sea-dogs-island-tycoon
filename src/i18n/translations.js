/**
 * Translations for Sea Dogs: Island Tycoon
 * Supports English (en) and French (fr)
 */

export const translations = {
  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      yes: 'Yes',
      no: 'No',
    },
    
    // Authentication
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      username: 'Username',
      password: 'Password',
      email: 'Email',
      confirmPassword: 'Confirm Password',
      enterUsername: 'Enter your username',
      enterPassword: 'Enter your password',
      enterEmail: 'your@email.com',
      loginTitle: '🏴‍☠️ Login',
      registerTitle: '🏴‍☠️ Register',
      passwordsDoNotMatch: 'Passwords do not match',
      emailRequired: 'Email is required',
      authenticationFailed: 'Authentication failed',
      cannotConnect: 'Cannot connect to server. Please make sure the backend is running.',
      cannotConnectProduction: 'Cannot connect to backend server. Please check that VITE_API_URL is configured in Vercel and backend is deployed on Railway.',
      dontHaveAccount: "Don't have an account? ",
      alreadyHaveAccount: 'Already have an account? ',
    },
    
    // Navigation
    nav: {
      island: 'Island',
      islandShort: 'Island',
      fleet: 'Fleet',
      fleetShort: 'Fleet',
      technology: 'Technology',
      technologyShort: 'Tech',
      crew: 'Crew',
      crewShort: 'Crew',
      captains: 'Captains',
      captainsShort: 'Captains',
      recruitment: 'Recruitment',
      recruitmentShort: 'Recruit',
      events: 'Events',
      eventsShort: 'Events',
      sea: 'Sea',
      seaShort: 'Sea',
      alliance: 'Alliance',
      allianceShort: 'Alliance',
      leaderboard: 'Leaderboard',
      leaderboardShort: 'Rank',
      system: 'System',
      systemShort: 'System',
    },
    
    // Resources
    resources: {
      gold: 'Gold',
      wood: 'Wood',
      rum: 'Rum',
      stone: 'Stone',
      food: 'Food',
      crew: 'Crew',
      cannons: 'Cannons',
      diamonds: 'Diamonds',
      fragments: 'Fragments',
    },
    
    // Buildings
    buildings: {
      building: 'Building',
      level: 'Level',
      upgrade: 'Upgrade',
      build: 'Build',
      constructing: 'Building...',
      placeHere: 'Place here',
      clickToView: 'Click to view',
      cost: 'Cost',
      production: 'Production',
      description: 'Description',
    },
    
    // Ships
    ships: {
      ship: 'Ship',
      buildShip: 'Build Ship',
      repairShip: 'Repair Ship',
      selectShip: 'Select Ship',
      health: 'Health',
      attack: 'Attack',
      defense: 'Defense',
      speed: 'Speed',
    },
    
    // Technology
    technology: {
      research: 'Research',
      researching: 'Researching...',
      prerequisites: 'Prerequisites',
      effects: 'Effects',
    },
    
    // Crew
    crew: {
      recruit: 'Recruit',
      recruiting: 'Recruiting...',
    },
    
    // Captains
    captains: {
      captain: 'Captain',
      rarity: 'Rarity',
      skills: 'Skills',
      equip: 'Equip',
      unequip: 'Unequip',
    },
    
    // Gacha
    gacha: {
      pull: 'Pull',
      singlePull: 'Single Pull',
      multiPull: 'Multi Pull',
      cost: 'Cost',
      pity: 'Pity',
    },
    
    // Events
    events: {
      event: 'Event',
      active: 'Active',
      completed: 'Completed',
      reward: 'Reward',
    },
    
    // Sea
    sea: {
      map: 'Sea Map',
      travel: 'Travel',
      distance: 'Distance',
      position: 'Position',
    },
    
    // Alliance
    alliance: {
      create: 'Create Alliance',
      join: 'Join Alliance',
      members: 'Members',
      comingSoon: 'Coming soon...',
      description: 'Form alliances with other players to strengthen your position!',
    },
    
    // Leaderboard
    leaderboard: {
      topPlayers: 'Top Players',
      rank: 'Rank',
      player: 'Player',
      score: 'Score',
      yourRank: 'Your Rank',
    },
    
    // User Info
    user: {
      syncing: 'Synchronizing...',
      loggedInAs: 'Logged in as',
    },
    
    // Notifications
    notifications: {
      resourcesAdded: 'Resources added!',
      diamondsAdded: 'Diamonds added!',
      gameSaved: 'Game saved successfully',
      gameLoaded: 'Game loaded successfully',
    },
  },
  
  fr: {
    // Common
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      close: 'Fermer',
      save: 'Sauvegarder',
      delete: 'Supprimer',
      edit: 'Modifier',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      yes: 'Oui',
      no: 'Non',
    },
    
    // Authentication
    auth: {
      login: 'Connexion',
      register: 'Inscription',
      logout: 'Déconnexion',
      username: 'Nom d\'utilisateur',
      password: 'Mot de passe',
      email: 'Email',
      confirmPassword: 'Confirmer le mot de passe',
      enterUsername: 'Entrez votre nom d\'utilisateur',
      enterPassword: 'Entrez votre mot de passe',
      enterEmail: 'votre@email.com',
      loginTitle: '🏴‍☠️ Connexion',
      registerTitle: '🏴‍☠️ Inscription',
      passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',
      emailRequired: 'L\'email est obligatoire',
      authenticationFailed: 'Échec de l\'authentification',
      cannotConnect: 'Impossible de se connecter au serveur. Assurez-vous que le backend est en cours d\'exécution.',
      cannotConnectProduction: 'Impossible de se connecter au serveur backend. Vérifiez que VITE_API_URL est configuré dans Vercel et que le backend est déployé sur Railway.',
      dontHaveAccount: 'Vous n\'avez pas de compte ? ',
      alreadyHaveAccount: 'Vous avez déjà un compte ? ',
    },
    
    // Navigation
    nav: {
      island: 'Île',
      islandShort: 'Île',
      fleet: 'Flotte',
      fleetShort: 'Flotte',
      technology: 'Technologie',
      technologyShort: 'Tech',
      crew: 'Équipage',
      crewShort: 'Équipage',
      captains: 'Capitaines',
      captainsShort: 'Capitaines',
      recruitment: 'Recrutement',
      recruitmentShort: 'Recruter',
      events: 'Événements',
      eventsShort: 'Événements',
      sea: 'Mer',
      seaShort: 'Mer',
      alliance: 'Alliance',
      allianceShort: 'Alliance',
      leaderboard: 'Classement',
      leaderboardShort: 'Rang',
      system: 'Système',
      systemShort: 'Système',
    },
    
    // Resources
    resources: {
      gold: 'Or',
      wood: 'Bois',
      rum: 'Rhum',
      stone: 'Pierre',
      food: 'Nourriture',
      crew: 'Équipage',
      cannons: 'Canons',
      diamonds: 'Diamants',
      fragments: 'Fragments',
    },
    
    // Buildings
    buildings: {
      building: 'Bâtiment',
      level: 'Niveau',
      upgrade: 'Améliorer',
      build: 'Construire',
      constructing: 'Construction...',
      placeHere: 'Placer ici',
      clickToView: 'Cliquer pour voir',
      cost: 'Coût',
      production: 'Production',
      description: 'Description',
    },
    
    // Ships
    ships: {
      ship: 'Navire',
      buildShip: 'Construire un navire',
      repairShip: 'Réparer le navire',
      selectShip: 'Sélectionner un navire',
      health: 'Santé',
      attack: 'Attaque',
      defense: 'Défense',
      speed: 'Vitesse',
    },
    
    // Technology
    technology: {
      research: 'Recherche',
      researching: 'Recherche en cours...',
      prerequisites: 'Prérequis',
      effects: 'Effets',
    },
    
    // Crew
    crew: {
      recruit: 'Recruter',
      recruiting: 'Recrutement...',
    },
    
    // Captains
    captains: {
      captain: 'Capitaine',
      rarity: 'Rareté',
      skills: 'Compétences',
      equip: 'Équiper',
      unequip: 'Déséquiper',
    },
    
    // Gacha
    gacha: {
      pull: 'Tirer',
      singlePull: 'Tirage simple',
      multiPull: 'Tirage multiple',
      cost: 'Coût',
      pity: 'Pitié',
    },
    
    // Events
    events: {
      event: 'Événement',
      active: 'Actif',
      completed: 'Terminé',
      reward: 'Récompense',
    },
    
    // Sea
    sea: {
      map: 'Carte de la mer',
      travel: 'Voyager',
      distance: 'Distance',
      position: 'Position',
    },
    
    // Alliance
    alliance: {
      create: 'Créer une alliance',
      join: 'Rejoindre une alliance',
      members: 'Membres',
      comingSoon: 'Bientôt disponible...',
      description: 'Formez des alliances avec d\'autres joueurs pour renforcer votre position !',
    },
    
    // Leaderboard
    leaderboard: {
      topPlayers: 'Meilleurs joueurs',
      rank: 'Rang',
      player: 'Joueur',
      score: 'Score',
      yourRank: 'Votre rang',
    },
    
    // User Info
    user: {
      syncing: 'Synchronisation...',
      loggedInAs: 'Connecté en tant que',
    },
    
    // Notifications
    notifications: {
      resourcesAdded: 'Ressources ajoutées !',
      diamondsAdded: 'Diamants ajoutés !',
      gameSaved: 'Jeu sauvegardé avec succès',
      gameLoaded: 'Jeu chargé avec succès',
    },
  },
};

// Default language
export const defaultLanguage = 'en';

// Available languages
export const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

