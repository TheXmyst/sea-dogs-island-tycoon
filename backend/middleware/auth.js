/**
 * Middleware d'authentification JWT
 * Protège les routes API nécessitant une authentification
 */

import jwt from 'jsonwebtoken';

/**
 * Middleware pour vérifier le token JWT
 * Vérifie que l'utilisateur est authentifié et ajoute req.user
 */
export function authenticateToken(req, res, next) {
  // Extraire le token du header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token d\'authentification manquant. Veuillez vous connecter.' 
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET non configuré dans les variables d\'environnement');
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur de configuration serveur' 
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expiré. Veuillez vous reconnecter.' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        error: 'Token invalide.' 
      });
    } else {
      console.error('Erreur de vérification du token:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur d\'authentification' 
      });
    }
  }
}

/**
 * Middleware pour vérifier que l'utilisateur accède uniquement à ses propres données
 * À utiliser après authenticateToken
 */
export function verifyOwnership(req, res, next) {
  const requestedPlayerId = req.params.playerId || req.body.playerId;
  const authenticatedUserId = req.user?.id;

  if (!requestedPlayerId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID joueur manquant' 
    });
  }

  // Convertir en nombre si nécessaire (pour comparaison)
  const requestedId = parseInt(requestedPlayerId);
  const authenticatedId = parseInt(authenticatedUserId);

  if (requestedId !== authenticatedId) {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès non autorisé. Vous ne pouvez accéder qu\'à vos propres données.' 
    });
  }

  next();
}

/**
 * Génère un token JWT pour un utilisateur
 */
export function generateToken(userId, username) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET non configuré');
  }

  // Token valide pendant 7 jours
  return jwt.sign(
    { id: userId, username: username },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

