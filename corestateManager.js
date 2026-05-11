// ============================================
// MARKETPULSE PRO - STATE MANAGER
// ============================================

class StateManager {
  constructor() {
    this.state = {
      // Market Data
      stocks: [],
      indices: {},
      marketStatus: 'CLOSED',
      
      // User Data
      watchlist: this.loadFromStorage(CONFIG.storage.watchlist, []),
      portfolio: this.loadFromStorage(CONFIG.storage.portfolio, {
        balance: 1000000,
        holdings: [],
        transactions: []
      }),
      alerts: this.loadFromStorage(CONFIG.storage.alerts, []),
      
      // UI State
      activeView: 'dashboard',
      activeSymbol: null,
      theme: this.loadFromStorage(CONFIG.storage.theme, 'light'),
      sidebarCollapsed: false,
      rightPanelVisible: true,
      
      // Chart State
      chartTimeframe: CONFIG.charts.defaultTimeframe,
      chartIndicators: ['SMA20', 'SMA50'],
      
      // Connection
      isConnected: false,
      lastUpdate: null,
    };
    
    this.listeners = new Map();
    this.initializeTheme();
  }
  
  get(key) {
    return this.state[key];
  }
  
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notify(key, value, oldValue);
    
    // Auto-save to storage for persistent data
    if (CONFIG.storage[key]) {
      this.saveToStorage(CONFIG.storage[key], value);
    }
  }
  
  update(key, updater) {
    const oldValue = this.state[key];
    const newValue = updater(oldValue);
    this.state[key] = newValue;
    this.notify(key, newValue, oldValue);
  }
  
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }
  
  notify(key, newValue, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in state listener for ${key}:`, error);
        }
      });
    }
  }
  
  loadFromStorage(key, defaultValue) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error);
      return defaultValue;
    }
  }
  
  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }
  
  initializeTheme() {
    document.documentElement.setAttribute('data-theme', this.state.theme);
  }
  
  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.set('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }
}

// Create global state manager instance
const stateManager = new StateManager();
