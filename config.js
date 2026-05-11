// ============================================
// MARKETPULSE PRO - CONFIGURATION
// ============================================

const CONFIG = {
  // API Configuration
  api: {
    baseURL: 'https://dreamstock-backend.onrender.com',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
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
    timezone: 'Asia/Kolkata',
    refreshInterval: 60000, // 1 minute
    indices: ['NIFTY 50', 'SENSEX', 'BANK NIFTY', 'NIFTY IT'],
  },
  
  // Chart Configuration
  charts: {
    defaultTimeframe: '1D',
    availableTimeframes: ['1m', '5m', '15m', '1H', '1D', '1W', '1M'],
    colors: {
      up: '#26a69a',
      down: '#ef5350',
      volume: '#42a5f5',
    },
  },
  
  // Technical Indicators
  indicators: {
    rsi: { period: 14, overbought: 70, oversold: 30 },
    macd: { fast: 12, slow: 26, signal: 9 },
    bollinger: { period: 20, stdDev: 2 },
    sma: { periods: [20, 50, 200] },
    ema: { periods: [12, 26] },
  },
  
  // Storage Keys
  storage: {
    watchlist: 'mp_watchlist',
    portfolio: 'mp_portfolio',
    alerts: 'mp_alerts',
    settings: 'mp_settings',
    theme: 'mp_theme',
  },
  
  // Feature Flags
  features: {
    realTimeUpdates: true,
    notifications: true,
    advancedCharts: true,
    paperTrading: true,
    aiPredictions: false,
  },
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
