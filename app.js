// ============================================
// MARKETPULSE PRO - MAIN APPLICATION
// ============================================

class MarketPulseApp {
  constructor() {
    this.components = {};
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing MarketPulse Pro...');
    this.showLoading(true);
    
    try {
      // Initialize core services
      await this.initializeServices();
      
      // Register components
      this.registerComponents();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      // Show platform
      this.showLoading(false);
      document.getElementById('mainPlatform').style.display = 'flex';
      
      // Update market status
      this.updateMarketStatus();
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      this.initialized = true;
      console.log('✅ MarketPulse Pro initialized successfully');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.showError('Failed to initialize platform. Please refresh.');
    }
  }
  
  async initializeServices() {
    // Connect to WebSocket for real-time updates
    if (CONFIG.features.realTimeUpdates) {
      webSocketService.connect();
    }
    
    // Subscribe to events
    this.setupEventSubscriptions();
  }
  
  registerComponents() {
    this.components = {
      charts: new ChartsComponent(),
      screener: new ScreenerComponent(),
      watchlist: new WatchlistComponent(),
      portfolio: new PortfolioComponent(),
      alerts: new AlertsComponent(),
      news: new NewsComponent(),
    };
  }
  
  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.navigateTo(view);
      });
    });
    
    // Global search
    const searchInput = document.getElementById('globalSearch');
    searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
    
    // Navigation buttons
    document.getElementById('btnWatchlist').addEventListener('click', () => this.navigateTo('watchlist'));
    document.getElementById('btnAlerts').addEventListener('click', () => this.navigateTo('alerts'));
    document.getElementById('btnPortfolio').addEventListener('click', () => this.navigateTo('portfolio'));
    document.getElementById('btnSettings').addEventListener('click', () => this.openSettings());
    
    // Panel tabs
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchPanel(e.currentTarget.dataset.panel);
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }
  
  setupEventSubscriptions() {
    eventBus.on(EventBus.Events.MARKET_DATA_UPDATED, (data) => {
      this.updateUI(data);
    });
    
    eventBus.on(EventBus.Events.STOCK_SELECTED, (symbol) => {
      stateManager.set('activeSymbol', symbol);
      this.showStockDetails(symbol);
    });
    
    eventBus.on(EventBus.Events.CONNECTION_CHANGED, (status) => {
      this.updateConnectionStatus(status);
    });
    
    eventBus.on(EventBus.Events.ERROR_OCCURRED, (error) => {
      this.showToast(error.message, 'error');
    });
  }
  
  async loadInitialData() {
    try {
      // Load market data
      const marketData = await apiService.getMarketWatch();
      stateManager.set('stocks', marketData.data);
      
      // Load watchlist
      this.components.watchlist.loadWatchlist();
      
      // Load portfolio
      this.components.portfolio.loadPortfolio();
      
      // Load alerts
      this.components.alerts.loadAlerts();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      throw error;
    }
  }
  
  navigateTo(view) {
    stateManager.set('activeView', view);
    
    // Update sidebar active state
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });
    
    // Load view content
    this.loadView(view);
    
    eventBus.emit(EventBus.Events.VIEW_CHANGED, view);
  }
  
  async loadView(view) {
    const contentArea = document.getElementById('contentArea');
    
    switch (view) {
      case 'dashboard':
        contentArea.innerHTML = await this.renderDashboard();
        break;
      case 'watchlist':
        contentArea.innerHTML = this.components.watchlist.render();
        break;
      case 'charts':
        contentArea.innerHTML = this.components.charts.render();
        break;
      case 'screener':
        contentArea.innerHTML = this.components.screener.render();
        break;
      case 'portfolio':
        contentArea.innerHTML = this.components.portfolio.render();
        break;
      case 'alerts':
        contentArea.innerHTML = this.components.alerts.render();
        break;
      case 'news':
        contentArea.innerHTML = await this.components.news.render();
        break;
      default:
        contentArea.innerHTML = await this.renderDashboard();
    }
  }
  
  async renderDashboard() {
    const stocks = stateManager.get('stocks');
    
    return `
      <div class="dashboard">
        <div class="dashboard-header">
          <h2>Market Dashboard</h2>
          <div class="dashboard-actions">
            <button class="btn btn-outline btn-sm" onclick="app.refreshData()">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card card">
            <div class="card-body">
              <div class="stat-label">Total Stocks</div>
              <div class="stat-value">${stocks.length}</div>
            </div>
          </div>
          <div class="stat-card card">
            <div class="card-body">
              <div class="stat-label">Advancing</div>
              <div class="stat-value positive">${stocks.filter(s => s.change > 0).length}</div>
            </div>
          </div>
          <div class="stat-card card">
            <div class="card-body">
              <div class="stat-label">Declining</div>
              <div class="stat-value negative">${stocks.filter(s => s.change < 0).length}</div>
            </div>
          </div>
          <div class="stat-card card">
            <div class="card-body">
              <div class="stat-label">Unchanged</div>
              <div class="stat-value">${stocks.filter(s => s.change === 0).length}</div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-grid">
          <div class="card">
            <div class="card-header">
              <h3>Top Gainers</h3>
            </div>
            <div class="card-body">
              ${this.renderTopMovers('gainers')}
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h3>Top Losers</h3>
            </div>
            <div class="card-body">
              ${this.renderTopMovers('losers')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderTopMovers(type) {
    const stocks = stateManager.get('stocks');
    const sorted = [...stocks]
      .filter(s => type === 'gainers' ? s.change > 0 : s.change < 0)
      .sort((a, b) => type === 'gainers' ? b.change - a.change : a.change - b.change)
      .slice(0, 5);
    
    return sorted.map(stock => `
      <div class="mover-item" onclick="eventBus.emit(EventBus.Events.STOCK_SELECTED, '${stock.symbol}')">
        <div class="mover-info">
          <span class="mover-symbol">${stock.symbol}</span>
          <span class="mover-name">${stock.name}</span>
        </div>
        <div class="mover-price">
          <span class="price">₹${stock.price.toFixed(2)}</span>
          <span class="change ${stock.change >= 0 ? 'positive' : 'negative'}">
            ${stock.change >= 0 ? '+' : ''}${stock.change}%
          </span>
        </div>
      </div>
    `).join('');
  }
  
  handleSearch(event) {
    const query = event.target.value.trim();
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');
    
    searchClear.style.display = query ? 'block' : 'none';
    
    if (query.length < 2) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
      return;
    }
    
    const stocks = stateManager.get('stocks');
    const results = stocks.filter(s => 
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    searchResults.innerHTML = results.map(stock => `
      <div class="search-result-item" onclick="eventBus.emit(EventBus.Events.STOCK_SELECTED, '${stock.symbol}')">
        <div class="result-symbol">${stock.symbol}</div>
        <div class="result-name">${stock.name}</div>
        <div class="result-price">₹${stock.price.toFixed(2)}</div>
      </div>
    `).join('');
    
    searchResults.classList.toggle('active', results.length > 0);
  }
  
  updateMarketStatus() {
    const now = new Date();
    const [openHour, openMin] = CONFIG.market.openTime.split(':').map(Number);
    const [closeHour, closeMin] = CONFIG.market.closeTime.split(':').map(Number);
    
    const marketOpen = new Date(now);
    marketOpen.setHours(openHour, openMin, 0);
    
    const marketClose = new Date(now);
    marketClose.setHours(closeHour, closeMin, 0);
    
    const isOpen = now >= marketOpen && now <= marketClose && now.getDay() !== 0 && now.getDay() !== 6;
    
    stateManager.set('marketStatus', isOpen ? 'OPEN' : 'CLOSED');
    
    const statusElement = document.getElementById('marketStatus');
    statusElement.querySelector('.status-indicator').className = 
      `status-indicator ${isOpen ? 'open' : 'closed'}`;
    statusElement.querySelector('.status-text').textContent = 
      isOpen ? 'Market Open' : 'Market Closed';
  }
  
  updateConnectionStatus(status) {
    const connectionStatus = document.getElementById('connectionStatus');
    const icon = connectionStatus.querySelector('i');
    
    icon.className = 'fas fa-circle';
    icon.classList.add(status === 'connected' ? 'connected' : 'disconnected');
    connectionStatus.lastChild.textContent = 
      status === 'connected' ? ' Connected' : ' Disconnected';
  }
  
  startPeriodicUpdates() {
    // Update market data every minute
    setInterval(async () => {
      try {
        const data = await apiService.getMarketWatch();
        stateManager.set('stocks', data.data);
        eventBus.emit(EventBus.Events.MARKET_DATA_UPDATED, data.data);
      } catch (error) {
        console.error('Periodic update failed:', error);
      }
    }, CONFIG.market.refreshInterval);
    
    // Update market status every 30 seconds
    setInterval(() => this.updateMarketStatus(), 30000);
  }
  
  refreshData() {
    this.loadInitialData();
    this.showToast('Data refreshed successfully', 'success');
  }
  
  showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
  }
  
  showError(message) {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
      loadingMessage.textContent = message;
      loadingMessage.style.color = 'var(--danger)';
    }
  }
  
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  handleKeyboardShortcuts(event) {
    // Ctrl+K - Focus search
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      document.getElementById('globalSearch').focus();
    }
    
    // Escape - Clear search
    if (event.key === 'Escape') {
      document.getElementById('globalSearch').value = '';
      document.getElementById('searchResults').classList.remove('active');
    }
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize application when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new MarketPulseApp();
  app.initialize();
});
