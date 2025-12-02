/**
 * Rate Limiting middleware
 * Protège contre les attaques par force brute et les abus
 */

// Rate limit storage (en mémoire, se réinitialise au redémarrage)
const rateLimitStore = new Map();

/**
 * Nettoie les anciennes entrées de rate limiting
 */
function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Nettoyage toutes les heures
setInterval(cleanupRateLimit, 3600000);

/**
 * Rate limiter générique
 * @param {Object} options - Options de configuration
 * @param {number} options.windowMs - Fenêtre de temps en millisecondes
 * @param {number} options.maxRequests - Nombre maximum de requêtes dans la fenêtre
 * @param {string} options.message - Message d'erreur personnalisé
 */
export function createRateLimiter({ windowMs = 60000, maxRequests = 100, message = 'Trop de requêtes. Veuillez réessayer plus tard.' }) {
  return (req, res, next) => {
    const clientIP = getClientIP(req);
    const key = `${req.method}:${req.path}:${clientIP}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    // Créer ou réinitialiser le record si nécessaire
    if (!record || record.resetAt < now) {
      record = {
        count: 0,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, record);
    }

    // Incrémenter le compteur
    record.count++;

    // Vérifier la limite
    if (record.count > maxRequests) {
      const waitTime = Math.ceil((record.resetAt - now) / 1000);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: waitTime,
      });
    }

    // Ajouter les headers de rate limit
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetAt).toISOString());

    next();
  };
}

/**
 * Helper pour obtenir l'IP du client
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

// Export pour utilisation dans d'autres fichiers
export { getClientIP };

