// ============================================
// MARKETPULSE PRO - CONFIGURATION
// ============================================

const CONFIG = {
  // API Configuration
  api: {
    baseURL: 'https://dreamstock-backend.onrender.com',
    timeout: timeout: 90000, // Give Render.com time to wake up from sleep,
    retryAttempts: 3,
  },
  
  // WebSocket Configuration
  websocket: {
    url: 'wss://dreamstock-backend.onrender.com/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
  },
  
  // Market Configuration
  market: {
    openTime: '09:15',
    closeTime: '15:30',
    refreshInterval: 60000, // 1 minute
  },
  
  // Storage Keys
  storage: {
    watchlist: 'mp_watchlist',
    theme: 'mp_theme',
    settings: 'mp_settings',
  },
  
  // Feature Flags
  features: {
    realTimeUpdates: true,
    notifications: true,
  },
};

// Freeze to prevent modifications
Object.freeze(CONFIG);
