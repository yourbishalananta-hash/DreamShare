// ============================================
// MARKETPULSE PRO - CONFIGURATION
// ============================================

const CONFIG = {
  api: {
    baseURL: 'https://dreamstock-backend.onrender.com',
    timeout: 90000,
    retryAttempts: 3
  },
  
  websocket: {
    url: 'wss://dreamstock-backend.onrender.com/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  },
  
  market: {
    openTime: '09:15',
    closeTime: '15:30',
    refreshInterval: 60000
  },
  
  storage: {
    watchlist: 'mp_watchlist',
    theme: 'mp_theme',
    settings: 'mp_settings'
  },
  
  features: {
    realTimeUpdates: true,
    notifications: true
  }
};

// Freeze to prevent modifications
Object.freeze(CONFIG);
