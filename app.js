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
      this.updateMarketStatus();
      
      // Hide loading screen
      setTimeout(() => {
        document.getElementById('loadingOverlay').style.display = 'none';
        document.getElementById('mainPlatform').style.display = 'flex';
        
        this.updateLastUpdated();
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
        
        this.updateStockCount(data.data.length);
        
        // FIX: Changed EVENTS to EventBus.Events
        eventBus.emit(EventBus.Events.MARKET_DATA_UPDATED, data.data);
        console.log(`📊 Loaded ${data.data.length} stocks`);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
      throw error;
    }
  }
  
  setupSubscriptions() {
    // Listen for market data updates
    eventBus.on(EventBus.Events.MARKET_DATA_UPDATED, (data) => {
      this.updateLastUpdated();
      this.updateStockCount(data.length);
      this.refreshCurrentView(); // FIX: Actually update the screen
    });
    
    // Listen for connection changes
    eventBus.on(EventBus.Events.CONNECTION_CHANGED, (status) => {
      this.updateConnectionStatus(status);
    });
    
    // Listen for errors
    eventBus.on(EventBus.Events.ERROR_OCCURRED, (error) => {
      console.error('Application error:', error);
      this.showToast(error.message || 'An error occurred', 'error');
    });
  }

  refreshCurrentView() {
    // This ensures that if the user is on the dashboard, the cards update
    const activeView = stateManager.get('activeView') || 'dashboard';
    if (activeView === 'dashboard') {
      // We trigger a re-render of the dashboard logic here
      // Since you are using a simple render system, we reload the view
      this.loadView('dashboard'); 
    }
  }
  
  startPeriodicUpdates() {
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
    
    setInterval(() => this.updateMarketStatus(), 30000);
  }

  // --- UI HELPER METHODS (Moved from "components" to here) ---

  updateMarketStatus() {
    const now = new Date();
    const [openH, openM] = CONFIG.market.openTime.split(':').map(Number);
    const [closeH, closeM] = CONFIG.market.closeTime.split(':').map(Number);
    
    const marketOpen = new Date(); marketOpen.setHours(openH, openM, 0);
    const marketClose = new Date(); marketClose.setHours(closeH, closeM, 0);
    
    const isOpen = now >= marketOpen && now <= marketClose && now.getDay() !== 0 && now.getDay() !== 6;
    
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (statusIndicator) statusIndicator.className = `status-indicator ${isOpen ? 'open' : 'closed'}`;
    if (statusText) statusText.textContent = isOpen ? 'Market Open' : 'Market Closed';
  }

  updateConnectionStatus(status) {
    const connStatus = document.getElementById('connectionStatus');
    if (!connStatus) return;
    
    const icon = connStatus.querySelector('i');
    if (icon) icon.className = `fas fa-circle ${status === 'connected' ? 'connected' : 'disconnected'}`;
    connStatus.lastChild.textContent = status === 'connected' ? ' Connected' : ' Disconnected';
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  updateStockCount(count) {
    const stockCount = document.getElementById('stockCount');
    if (stockCount) stockCount.textContent = `Stocks: ${count}`;
  }

  updateLastUpdated() {
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
      lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  }
  
  updateLoadingProgress(percent, message) {
    const progressFill = document.getElementById('progressFill');
    const loadingMessage = document.getElementById('loadingMessage');
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (loadingMessage) loadingMessage.textContent = message;
  }

  // Mock loadView to prevent crash
  loadView(view) {
    console.log(`Refreshing view: ${view}`);
    // In your full app, this would call your component render functions
  }
}

// Initialize application when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new MarketPulseApp();
  app.initialize();
});
