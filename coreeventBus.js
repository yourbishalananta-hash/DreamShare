// ============================================
// MARKETPULSE PRO - EVENT BUS
// ============================================

class EventBus {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
  
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event "${event}":`, error);
      }
    });
  }
}

// Event constants
const EVENTS = {
  MARKET_DATA_LOADED: 'market:dataLoaded',
  MARKET_DATA_UPDATED: 'market:dataUpdated',
  STOCK_SELECTED: 'stock:selected',
  VIEW_CHANGED: 'view:changed',
  CONNECTION_CHANGED: 'connection:changed',
  THEME_CHANGED: 'theme:changed',
  ERROR_OCCURRED: 'error:occurred',
};

// Create global instance
const eventBus = new EventBus();
