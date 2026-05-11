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
      
      // Hide loading screen and show platform
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
      this.showToast('Failed to load market data. Check your connection.', 'error');
    }
  }
  
  async loadMarketData() {
    try {
      const data = await apiService.getMarketWatch();
      
      if (data && data.data) {
        stateManager.set('stocks', data.data);
        stateManager.set('lastUpdate', new Date());
        
        this.updateStockCount(data.data.length);
        
        // Correct event reference
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
      this.refreshCurrentView(); // Actually update the UI
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
    // Re-render the current view with updated data
    const activeView = stateManager.get('activeView') || 'dashboard';
    
    if (window.components && window.components.navigateTo) {
      window.components.navigateTo(activeView);
    }
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
    setInterval(() => this.updateMarketStatus(), 30000);
  }

  // UI Helper Methods
  
  updateMarketStatus() {
    const now = new Date();
    const [openH, openM] = CONFIG.market.openTime.split(':').map(Number);
    const [closeH, closeM] = CONFIG.market.closeTime.split(':').map(Number);
    
    const marketOpen = new Date(); 
    marketOpen.setHours(openH, openM, 0);
    
    const marketClose = new Date(); 
    marketClose.setHours(closeH, closeM, 0);
    
    const isOpen = now >= marketOpen && now <= marketClose && 
                   now.getDay() !== 0 && now.getDay() !== 6;
    
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${isOpen ? 'open' : 'closed'}`;
    }
    if (statusText) {
      statusText.textContent = isOpen ? 'Market Open' : 'Market Closed';
    }
    
    // Update market time message
    const marketTime = document.getElementById('marketTime');
    if (marketTime) {
      if (isOpen) {
        const timeLeft = marketClose - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        marketTime.textContent = `Market closes in: ${hours}h ${minutes}m`;
      } else if (now.getDay() === 0 || now.getDay() === 6) {
        marketTime.textContent = 'Market Closed (Weekend)';
      } else {
        const timeToOpen = marketOpen - now;
        if (timeToOpen < 0) {
          // Market closed for the day
          const nextOpen = new Date(marketOpen);
          nextOpen.setDate(nextOpen.getDate() + 1);
          const timeLeft = nextOpen - now;
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          marketTime.textContent = `Opens tomorrow at ${CONFIG.market.openTime}`;
        } else {
          const hours = Math.floor(timeToOpen / (1000 * 60 * 60));
          const minutes = Math.floor((timeToOpen % (1000 * 60 * 60)) / (1000 * 60));
          marketTime.textContent = `Opens in: ${hours}h ${minutes}m`;
        }
      }
    }
  }

  updateConnectionStatus(status) {
    const connStatus = document.getElementById('connectionStatus');
    if (!connStatus) return;
    
    const icon = connStatus.querySelector('i');
    if (icon) {
      icon.className = `fas fa-circle ${status === 'connected' ? 'connected' : 'disconnected'}`;
    }
    
    // Update text node (last child)
    const textNode = connStatus.lastChild;
    if (textNode) {
      textNode.textContent = status === 'connected' ? ' Connected' : ' Disconnected';
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };
    
    const colors = {
      success: 'var(--success)',
      error: 'var(--danger)',
      info: 'var(--primary-500)'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type]}" style="color: ${colors[type]};"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  updateStockCount(count) {
    const stockCount = document.getElementById('stockCount');
    if (stockCount) {
      stockCount.textContent = `Stocks: ${count}`;
    }
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
