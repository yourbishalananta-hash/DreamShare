// ============================================
// MARKETPULSE PRO - EVENT BUS
// ============================================

// Define events as a plain object so they are globally available and bulletproof
const APP_EVENTS = {
  MARKET_DATA_UPDATED: 'market:dataUpdated',
  STOCK_SELECTED: 'stock:selected',
  WATCHLIST_UPDATED: 'watchlist:updated',
  PORTFOLIO_UPDATED: 'portfolio:updated',
  ALERT_TRIGGERED: 'alert:triggered',
  CONNECTION_CHANGED: 'connection:changed',
  THEME_CHANGED: 'theme:changed',
  VIEW_CHANGED: 'view:changed',
  TIMEFRAME_CHANGED: 'timeframe:changed',
  ERROR_OCCURRED: 'error:occurred',
};

class EventBus {
  constructor() {
    this.events = new Map();
  }
  
  on(event, callback, priority = 0) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push({ callback, priority });
    this.events.get(event).sort((a, b) => b.priority - a.priority);
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (!this.events.has(event)) return;
    const listeners = this.events.get(event);
    const index = listeners.findIndex(l => l.callback === callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  emit(event, ...args) {
    if (!this.events.has(event)) return;
    const listeners = [...this.events.get(event)];
    listeners.forEach(({ callback }) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }
}

// Create global event bus instance
const eventBus = new EventBus();
