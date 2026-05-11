// ============================================
// MARKETPULSE PRO - MAIN APPLICATION
// ============================================

class MarketPulseApp {
  constructor() {
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing MarketPulse Pro...');
    this.updateLoadingProgress(10, 'Loading configuration...');
    
    try {
      // Initialize components
      this.updateLoadingProgress(30, 'Connecting to server...');
      
      // Load market data
      await this.loadMarketData();
      this.updateLoadingProgress(70, 'Building interface...');
      
      // Setup subscriptions
      this.setupSubscriptions();
      this.updateLoadingProgress(90, 'Finalizing...');
      
      // Connect WebSocket for real-time updates
      if (CONFIG.features.realTimeUpdates) {
        webSocketService.connect();
      }
      
      // Update market status
      if (components) {
        components.updateMarketStatus();
      }
      
      // Hide loading screen
      setTimeout(() => {
        document.getElementById('loadingOverlay').style.display = 'none';
        document.getElementById('mainPlatform').style.display = 'flex';
        
        // Update last updated time
        this.updateLastUpdated();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        this.initialized = true;
        console.log('✅ MarketPulse Pro initialized successfully');
      }, 500);
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.updateLoadingProgress(100, 'Failed to initialize. Please refresh.');
    }
  }
  
  async loadMarketData() {
    try {
      const data = await apiService.getMarketWatch();
      
      if (data && data.data) {
        stateManager.set('stocks', data.data);
        stateManager.set('lastUpdate', new Date());
        
        // Update stock count
        const stockCount = document.getElementById('stockCount');
        if (stockCount) {
          stockCount.textContent = `Stocks: ${data.data.length}`;
        }
        
        eventBus.emit(EVENTS.MARKET_DATA_LOADED, data.data);
        console.log(`📊 Loaded ${data.data.length} stocks`);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
      throw error;
    }
  }
  
  setupSubscriptions() {
    // Listen for market data updates
    eventBus.on(EVENTS.MARKET_DATA_UPDATED, (data) => {
      this.updateLastUpdated();
      const stockCount = document.getElementById('stockCount');
      if (stockCount) {
        stockCount.textContent = `Stocks: ${data.length}`;
      }
    });
    
    // Listen for connection changes
    eventBus.on(EVENTS.CONNECTION_CHANGED, (status) => {
      if (components) {
        components.updateConnectionStatus(status);
      }
    });
    
    // Listen for errors
    eventBus.on(EVENTS.ERROR_OCCURRED, (error) => {
      console.error('Application error:', error);
      if (components) {
        components.showToast(error.message || 'An error occurred', 'error');
      }
    });
  }
  
  startPeriodicUpdates() {
    // Refresh data every minute
    setInterval(async () => {
      try {
        const data = await apiService.getMarketWatch();
        if (data && data.data) {
          stateManager.set('stocks', data.data);
          stateManager.set('lastUpdate', new Date());
        }
      } catch (error) {
        console.error('Periodic update failed:', error);
      }
    }, CONFIG.market.refreshInterval);
    
    // Update market status every 30 seconds
    setInterval(() => {
      if (components) {
        components.updateMarketStatus();
      }
    }, 30000);
  }
  
  updateLastUpdated() {
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
      const now = new Date();
      lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
  }
  
  updateLoadingProgress(percent, message) {
    const progressFill = document.getElementById('progressFill');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
  }
}

// Initialize application when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new MarketPulseApp();
  app.initialize();
});
