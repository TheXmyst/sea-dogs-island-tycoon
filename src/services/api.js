/**
 * API Service for backend communication
 */

// Detect environment
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Get API URL - prioritize VITE_API_URL, fallback based on environment
let API_BASE_URL = import.meta.env.VITE_API_URL;

// Remove trailing slash if present (to avoid double slashes)
if (API_BASE_URL && API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

if (!API_BASE_URL) {
  if (isProduction) {
    // In production, we MUST have VITE_API_URL set
    console.error('❌ VITE_API_URL is not set in production!');
    console.error('   Please configure VITE_API_URL in Vercel environment variables.');
    console.error('   Current hostname:', window.location.hostname);
    // Try to construct from current hostname (for Railway/Vercel subdomains)
    // This is a fallback, but VITE_API_URL should be set
    API_BASE_URL = 'http://localhost:5000'; // Will fail, but at least we know why
  } else {
    // Development: use localhost
    API_BASE_URL = 'http://localhost:5000';
  }
}

// Log API configuration (helpful for debugging)
console.log('🔧 API Configuration:', {
  environment: isProduction ? 'production' : 'development',
  apiUrl: API_BASE_URL,
  viteApiUrl: import.meta.env.VITE_API_URL || 'NOT SET',
  hostname: window.location.hostname,
  fullUrl: `${API_BASE_URL}/api/health`,
});

// Check if API is available (non-blocking)
let apiAvailable = true;
fetch(`${API_BASE_URL}/api/health`).catch(() => {
  apiAvailable = false;
  if (isProduction) {
    console.error('❌ Backend API not available in production!');
    console.error('   Check that:');
    console.error('   1. Backend is deployed on Railway');
    console.error('   2. VITE_API_URL is set in Vercel environment variables');
    console.error('   3. VITE_API_URL matches your Railway backend URL');
  } else {
    console.warn('⚠️ Backend API not available. Some features may not work.');
    console.warn('   Make sure backend is running: cd backend && npm run dev');
  }
});

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server error: ${text || response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';
      if (isProd) {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please check Vercel environment variables (VITE_API_URL) and ensure backend is deployed on Railway.`);
      } else {
        throw new Error('Cannot connect to server. Please make sure the backend is running: cd backend && npm run dev');
      }
    }
    
    throw error;
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  async register(username, password, email = '') {
    const response = await apiRequest('/api/players/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    
    // Store token if provided
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userId', response.id);
      localStorage.setItem('username', response.username);
    }
    
    return response;
  },

  async login(username, password) {
    const response = await apiRequest('/api/players/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    // Store token if provided
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userId', response.id);
      localStorage.setItem('username', response.username);
    }
    
    return response;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  getUserId() {
    return localStorage.getItem('userId');
  },

  getUsername() {
    return localStorage.getItem('username');
  },
};

/**
 * Game state API
 */
export const gameAPI = {
  async saveGameState(playerId, gameState) {
    return apiRequest(`/api/game/save/${playerId}`, {
      method: 'POST',
      body: JSON.stringify({
        resources: gameState.resources,
        buildings: gameState.buildings,
        ships: gameState.ships,
        captains: gameState.captains,
        captainSkins: gameState.captainSkins,
        activeSkins: gameState.activeSkins,
        crew: gameState.crew,
        researchedTechnologies: gameState.researchedTechnologies,
        technologyTimers: gameState.technologyTimers,
        gachaPity: gameState.gachaPity,
        eventProgress: gameState.eventProgress,
        timers: gameState.timers,
        version: gameState.version,
        lastUpdate: gameState.lastUpdate || Date.now(), // Include lastUpdate for offline progress
      }),
    });
  },

  async loadGameState(playerId) {
    return apiRequest(`/api/game/load/${playerId}`, {
      method: 'GET',
    });
  },
};

/**
 * Leaderboard API
 */
export const leaderboardAPI = {
  async getTopPlayers(limit = 10) {
    return apiRequest(`/api/leaderboard/top?limit=${limit}`, {
      method: 'GET',
    });
  },

  async getPlayerRank(playerId) {
    return apiRequest(`/api/leaderboard/rank/${playerId}`, {
      method: 'GET',
    });
  },
};

/**
 * Alliance API (stub for future)
 */
export const allianceAPI = {
  async createAlliance(name) {
    return apiRequest('/api/alliances/create', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async joinAlliance(allianceId) {
    return apiRequest(`/api/alliances/${allianceId}/join`, {
      method: 'POST',
    });
  },
};

