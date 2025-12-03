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
      currentProduction: 'Current Production',
      nextProduction: 'New Production',
      upgradeCost: 'Upgrade Cost',
      buildTime: 'Build Time',
      remaining: 'remaining',
      prerequisitesNotMet: 'Prerequisites not met',
      noProduction: 'No production',
      maxLevel: 'Building is at maximum level!',
      items: {
        town_hall: {
          name: 'Town Hall',
          description: 'The heart of your island. Unlocks new buildings and provides island-wide bonuses.',
        },
        gold_mine: {
          name: 'Gold Mine',
          description: 'Extracts precious gold from the island. Higher levels yield more gold.',
        },
        lumber_mill: {
          name: 'Lumber Mill',
          description: 'Processes trees into usable wood for construction.',
        },
        quarry: {
          name: 'Quarry',
          description: 'Extracts stone from the island bedrock.',
        },
        distillery: {
          name: 'Distillery',
          description: 'Brews fine rum for your crew and trade.',
        },
        tavern: {
          name: 'Tavern',
          description: 'Attracts new crew members to join your cause.',
        },
        dock: {
          name: 'Dock',
          description: 'Build and repair ships. Unlocks your fleet capabilities.',
        },
      },
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
      fleetManagement: 'Fleet Management',
      buildAndManage: 'Build and manage your pirate fleet',
      buildNewShip: 'Build New Ship',
      repairCost: 'Repair Cost',
      yourFleet: 'Your Fleet',
      noShips: 'No ships built yet. Build your first ship to start raiding!',
      readyForBattle: 'Ready for battle!',
      dockRequired: 'You need to build a Dock first to construct ships.',
      upgradeTownHall: 'Upgrade your Town Hall to Level 2 to unlock the Dock.',
      items: {
        sloop: {
          name: 'Small Sloop',
          description: 'Fast and agile, perfect for quick raids.',
        },
        brigantine: {
          name: 'Brigantine',
          description: 'A balanced ship for versatile combat.',
        },
        galleon: {
          name: 'Galleon',
          description: 'A powerful warship, slow but devastating.',
        },
      },
    },
    
    // Technology
    technology: {
      research: 'Research',
      researching: 'Researching...',
      prerequisites: 'Prerequisites',
      effects: 'Effects',
      technologyTree: 'Technology Tree',
      economy: 'Economy',
      military: 'Military',
      exploration: 'Exploration',
      level: 'Level',
      maxLevel: 'Technology is at maximum level!',
      prerequisitesNotMet: 'Prerequisites not met!',
      invalidLevel: 'Invalid technology level!',
      insufficientResources: 'Insufficient resources!',
      onlyOneResearch: 'You can only research one technology at a time!',
      alreadyResearching: 'Research already in progress!',
      researchStarted: 'Research started',
      cost: 'Cost',
      time: 'Time',
      currentLevel: 'Current Level',
      nextLevel: 'Next Level',
      unlock: 'Unlock',
      unlocked: 'Unlocked',
      locked: 'Locked',
    },
    
    // Crew
    crew: {
      recruit: 'Recruit',
      recruiting: 'Recruiting...',
      recruitment: 'Crew Recruitment',
      recruitSpecialized: 'Recruit specialized crew members to enhance your ships',
      researchCrewTraining: 'Research "Crew Training" technology to unlock specialized crew recruitment.',
      goToTechnology: 'Go to the Technology Tree to research it!',
      totalCrew: 'Total Crew',
      warriors: 'Warriors',
      archers: 'Archers',
      hunters: 'Hunters',
      individualStats: 'Individual Stats',
      shipBonuses: 'Ship Bonuses (per crew member)',
      owned: 'Owned',
      recruit1: 'Recruit 1',
      recruit5: 'Recruit 5',
      recruited: 'Recruited',
      insufficientResources: 'Insufficient resources!',
      researchFirst: 'Research "Crew Training" technology first!',
    },
    
    // Captains
    captains: {
      captain: 'Captain',
      rarity: 'Rarity',
      skills: 'Skills',
      equip: 'Equip',
      unequip: 'Unequip',
      level: 'Level',
      xp: 'XP',
      buffs: 'Buffs',
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
      combat: 'Combat',
      economy: 'Economy',
      exploration: 'Exploration',
      support: 'Support',
      commerce: 'Commerce',
      items: {
        anne_sharp: {
          name: 'Anne Sharp',
          description: 'A fierce fighter with a quick blade and unwavering courage.',
        },
        mary_read: {
          name: 'Mary Read',
          description: 'Efficient manager of island resources and trade routes.',
        },
        grace_o_malley: {
          name: 'Grace O\'Malley',
          description: 'Skilled navigator and explorer of uncharted waters.',
        },
        sarah_kidd: {
          name: 'Sarah Kidd',
          description: 'A supportive leader who boosts crew morale and efficiency.',
        },
        charlotte_badger: {
          name: 'Charlotte Badger',
          description: 'Veteran warrior with unmatched experience in naval combat.',
        },
        rachel_wall: {
          name: 'Rachel Wall',
          description: 'Master trader and resource optimizer with keen business sense.',
        },
        isabella_black: {
          name: 'Isabella Black',
          description: 'Daring explorer who discovers hidden treasures and secret routes.',
        },
        anne_bonny: {
          name: 'Anne Bonny',
          description: 'Legendary fighter feared across the seas, known for her ferocity.',
        },
        ching_shih: {
          name: 'Ching Shih',
          description: 'Strategic mastermind and fleet commander with unmatched leadership.',
        },
        elena_crimson: {
          name: 'Elena Crimson',
          description: 'Wealthy merchant captain who maximizes profits and trade efficiency.',
        },
        nadia: {
          name: 'Nadia',
          description: 'The Red-Haired Fury, a legendary pirate captain feared across all seas.',
        },
        sayyida_al_hurra: {
          name: 'Sayyida al-Hurra',
          description: 'Queen of the seas, master of all trades and supreme commander.',
        },
      },
    },
    
    // Gacha
    gacha: {
      pull: 'Pull',
      singlePull: 'Single Pull',
      multiPull: 'Multi Pull',
      cost: 'Cost',
      pity: 'Pity',
      captainRecruitment: 'Captain Recruitment',
      recruitPowerful: 'Recruit powerful captains to join your crew!',
      mustBeConnected: 'You must be connected to use the gacha (secure online system)',
      pitySystem: 'Pity System',
      epicGuarantee: 'Epic Guarantee',
      legendaryGuarantee: 'Legendary Guarantee',
      pulls: 'pulls',
      insufficientDiamonds: 'Insufficient diamonds!',
      needDiamonds: 'diamonds needed for 10 pulls.',
      mustBeLoggedIn: 'You must be logged in to use the gacha!\n\nThe gacha system is secure and requires a connection to work.',
      errorPull: 'Error: Failed to pull captain.',
      newCaptain: 'New Captain!',
      duplicateCaptain: 'Duplicate Captain',
      fragmentsReceived: 'Fragments received',
      multiPullResults: 'Multi Pull Results',
      close: 'Close',
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
      currentProduction: 'Production actuelle',
      nextProduction: 'Nouvelle production',
      upgradeCost: 'Coût d\'amélioration',
      buildTime: 'Temps de construction',
      remaining: 'restant',
      prerequisitesNotMet: 'Prérequis non remplis',
      noProduction: 'Aucune production',
      maxLevel: 'Le bâtiment est au niveau maximum !',
      items: {
        town_hall: {
          name: 'Hôtel de ville',
          description: 'Le cœur de votre île. Débloque de nouveaux bâtiments et fournit des bonus à l\'échelle de l\'île.',
        },
        gold_mine: {
          name: 'Mine d\'or',
          description: 'Extrait l\'or précieux de l\'île. Les niveaux supérieurs produisent plus d\'or.',
        },
        lumber_mill: {
          name: 'Scierie',
          description: 'Transforme les arbres en bois utilisable pour la construction.',
        },
        quarry: {
          name: 'Carrière',
          description: 'Extrait la pierre du substrat rocheux de l\'île.',
        },
        distillery: {
          name: 'Distillerie',
          description: 'Brasse du rhum fin pour votre équipage et le commerce.',
        },
        tavern: {
          name: 'Taverne',
          description: 'Attire de nouveaux membres d\'équipage à rejoindre votre cause.',
        },
        dock: {
          name: 'Quai',
          description: 'Construisez et réparez des navires. Débloque les capacités de votre flotte.',
        },
      },
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
      fleetManagement: 'Gestion de la flotte',
      buildAndManage: 'Construisez et gérez votre flotte de pirates',
      buildNewShip: 'Construire un nouveau navire',
      repairCost: 'Coût de réparation',
      yourFleet: 'Votre flotte',
      noShips: 'Aucun navire construit pour l\'instant. Construisez votre premier navire pour commencer les raids !',
      readyForBattle: 'Prêt pour le combat !',
      dockRequired: 'Vous devez d\'abord construire un Quai pour construire des navires.',
      upgradeTownHall: 'Améliorez votre Hôtel de ville au niveau 2 pour débloquer le Quai.',
      items: {
        sloop: {
          name: 'Petit sloop',
          description: 'Rapide et agile, parfait pour les raids rapides.',
        },
        brigantine: {
          name: 'Brigantin',
          description: 'Un navire équilibré pour un combat polyvalent.',
        },
        galleon: {
          name: 'Galion',
          description: 'Un puissant navire de guerre, lent mais dévastateur.',
        },
      },
    },
    
    // Technology
    technology: {
      research: 'Recherche',
      researching: 'Recherche en cours...',
      prerequisites: 'Prérequis',
      effects: 'Effets',
      technologyTree: 'Arbre technologique',
      economy: 'Économie',
      military: 'Militaire',
      exploration: 'Exploration',
      level: 'Niveau',
      maxLevel: 'La technologie est au niveau maximum !',
      prerequisitesNotMet: 'Prérequis non remplis !',
      invalidLevel: 'Niveau de technologie invalide !',
      insufficientResources: 'Ressources insuffisantes !',
      onlyOneResearch: 'Vous ne pouvez rechercher qu\'une seule technologie à la fois !',
      alreadyResearching: 'Recherche déjà en cours !',
      researchStarted: 'Recherche démarrée',
      cost: 'Coût',
      time: 'Temps',
      currentLevel: 'Niveau actuel',
      nextLevel: 'Niveau suivant',
      unlock: 'Débloquer',
      unlocked: 'Débloqué',
      locked: 'Verrouillé',
    },
    
    // Crew
    crew: {
      recruit: 'Recruter',
      recruiting: 'Recrutement...',
      recruitment: 'Recrutement d\'équipage',
      recruitSpecialized: 'Recrutez des membres d\'équipage spécialisés pour améliorer vos navires',
      researchCrewTraining: 'Recherchez la technologie "Formation d\'équipage" pour débloquer le recrutement spécialisé.',
      goToTechnology: 'Allez dans l\'arbre technologique pour la rechercher !',
      totalCrew: 'Équipage total',
      warriors: 'Guerriers',
      archers: 'Archers',
      hunters: 'Chasseurs',
      individualStats: 'Stats individuelles',
      shipBonuses: 'Bonus navire (par membre d\'équipage)',
      owned: 'Possédé',
      recruit1: 'Recruter 1',
      recruit5: 'Recruter 5',
      recruited: 'Recruté',
      insufficientResources: 'Ressources insuffisantes !',
      researchFirst: 'Recherchez d\'abord la technologie "Formation d\'équipage" !',
    },
    
    // Captains
    captains: {
      captain: 'Capitaine',
      rarity: 'Rareté',
      skills: 'Compétences',
      equip: 'Équiper',
      unequip: 'Déséquiper',
      level: 'Niveau',
      xp: 'XP',
      buffs: 'Bonus',
      common: 'Commun',
      rare: 'Rare',
      epic: 'Épique',
      legendary: 'Légendaire',
      combat: 'Combat',
      economy: 'Économie',
      exploration: 'Exploration',
      support: 'Soutien',
      commerce: 'Commerce',
      collection: 'Collection de capitaines',
      noCaptains: 'Vous n\'avez pas encore de capitaines !',
      goToRecruitment: 'Allez dans l\'onglet Recrutement pour tirer votre premier capitaine.',
      manage: 'Gérez vos capitaines et leur équipement',
      levelUp: 'Monter de niveau !',
      activeBuffs: 'Bonus actifs',
      skinsAvailable: 'skin disponible',
      levelAndExperience: 'Niveau et expérience',
      buffsAndBonuses: 'Bonus et avantages',
      skins: 'Skins',
      noSkins: 'Aucun skin disponible pour ce capitaine.',
      active: 'Actif',
      items: {
        anne_sharp: {
          name: 'Anne Sharp',
          description: 'Une combattante féroce avec une lame rapide et un courage inébranlable.',
        },
        mary_read: {
          name: 'Mary Read',
          description: 'Gestionnaire efficace des ressources de l\'île et des routes commerciales.',
        },
        grace_o_malley: {
          name: 'Grace O\'Malley',
          description: 'Navigatrice experte et exploratrice des eaux inexplorées.',
        },
        sarah_kidd: {
          name: 'Sarah Kidd',
          description: 'Une leader de soutien qui renforce le moral et l\'efficacité de l\'équipage.',
        },
        charlotte_badger: {
          name: 'Charlotte Badger',
          description: 'Guerrière vétérane avec une expérience inégalée en combat naval.',
        },
        rachel_wall: {
          name: 'Rachel Wall',
          description: 'Maître commerçante et optimisatrice de ressources avec un sens aigu des affaires.',
        },
        isabella_black: {
          name: 'Isabella Black',
          description: 'Exploratrice audacieuse qui découvre des trésors cachés et des routes secrètes.',
        },
        anne_bonny: {
          name: 'Anne Bonny',
          description: 'Combattante légendaire redoutée à travers les mers, connue pour sa férocité.',
        },
        ching_shih: {
          name: 'Ching Shih',
          description: 'Maître stratégique et commandant de flotte avec un leadership inégalé.',
        },
        elena_crimson: {
          name: 'Elena Crimson',
          description: 'Capitaine marchande riche qui maximise les profits et l\'efficacité commerciale.',
        },
        nadia: {
          name: 'Nadia',
          description: 'La Furie aux cheveux roux, une légendaire capitaine pirate redoutée à travers toutes les mers.',
        },
        sayyida_al_hurra: {
          name: 'Sayyida al-Hurra',
          description: 'Reine des mers, maître de tous les métiers et commandant suprême.',
        },
      },
    },
    
    // Gacha
    gacha: {
      pull: 'Tirer',
      singlePull: 'Tirage simple',
      multiPull: 'Tirage multiple',
      cost: 'Coût',
      pity: 'Pitié',
      captainRecruitment: 'Recrutement de capitaines',
      recruitPowerful: 'Recrutez de puissants capitaines pour rejoindre votre équipage !',
      mustBeConnected: 'Vous devez être connecté pour utiliser le gacha (système sécurisé en ligne)',
      pitySystem: 'Système de pitié',
      epicGuarantee: 'Garantie épique',
      legendaryGuarantee: 'Garantie légendaire',
      pulls: 'tirages',
      insufficientDiamonds: 'Diamants insuffisants !',
      needDiamonds: 'diamants nécessaires pour 10 tirages.',
      mustBeLoggedIn: 'Vous devez être connecté pour utiliser le gacha !\n\nLe système gacha est sécurisé et nécessite une connexion pour fonctionner.',
      errorPull: 'Erreur : Échec du tirage de capitaine.',
      newCaptain: 'Nouveau capitaine !',
      duplicateCaptain: 'Capitaine dupliqué',
      fragmentsReceived: 'Fragments reçus',
      multiPullResults: 'Résultats du tirage multiple',
      close: 'Fermer',
      pulling: 'Tirage en cours...',
      saveTime: 'Gagnez du temps !',
      or: 'ou',
      youOwnThis: 'Vous possédez déjà ce capitaine !',
      bonusApplied: 'bonus appliqué',
      newCaptains: 'Nouveaux capitaines',
      duplicates: 'Doublons',
      duplicate: 'Doublon',
      allResults: 'Tous les résultats',
      legendary: 'Légendaire',
      epic: 'Épique',
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

