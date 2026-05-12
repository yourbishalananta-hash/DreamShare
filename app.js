// ============================================
// DREAM SHARE - MAIN APPLICATION
// ============================================

class DreamShareApp {
  constructor() {
    this.components = {};
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('🚀 Initializing Dream Share...');
    this.showLoading(true);

    try {
      // Register components FIRST (they're synchronous and can't fail)
      this.registerComponents();

      // Initialize core services (websocket is non-blocking)
      this.initializeServices();

      // Set up event listeners
      this.setupEventListeners();

      // Load initial data (errors here are non-fatal)
      await this.loadInitialData();

      // Show platform regardless of data load result
      this.showLoading(false);
      document.getElementById('mainPlatform').style.display = 'flex';

      // Render the initial view (dashboard by default)
      const initialView = stateManager.get('activeView') || 'dashboard';
      await this.loadView(initialView);

      // Update market status and badges
      this.updateMarketStatus();
      this.updateBadges();

      // Start periodic updates
      this.startPeriodicUpdates();

      this.initialized = true;
      console.log('✅ Dream Share initialized successfully');

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      // Even on failure, show the platform so the user isn't stuck
      this.showLoading(false);
      document.getElementById('mainPlatform').style.display = 'flex';
      this.showToast('Initialization had errors. Some features may not work.', 'error');
      // Still try to render dashboard
      try { await this.loadView('dashboard'); } catch (_) {}
    }
  }

  initializeServices() {
    // Connect to WebSocket for real-time updates (non-blocking)
    if (CONFIG.features.realTimeUpdates && typeof webSocketService !== 'undefined') {
      try {
        webSocketService.connect();
      } catch (e) {
        console.warn('WebSocket connection failed:', e.message);
      }
    }

    // Subscribe to events
    this.setupEventSubscriptions();
  }

  registerComponents() {
    this.components = {
      charts:    new ChartsComponent(),
      screener:  new ScreenerComponent(),
      watchlist: new WatchlistComponent(),
      portfolio: new PortfolioComponent(),
      alerts:    new AlertsComponent(),
      news:      new NewsComponent(),
    };

    // Init each component safely
    Object.entries(this.components).forEach(([name, comp]) => {
      try {
        if (typeof comp.init === 'function') comp.init();
      } catch (e) {
        console.warn(`Component ${name} init failed:`, e.message);
      }
    });
  }

  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        if (view) this.navigateTo(view);
      });
    });

    // Global search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
    }

    // Search clear button
    const searchClear = document.getElementById('searchClear');
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        document.getElementById('searchResults').classList.remove('active');
        searchClear.style.display = 'none';
      });
    }

    // Navigation buttons
    this.safeBind('btnWatchlist', () => this.navigateTo('watchlist'));
    this.safeBind('btnAlerts',    () => this.navigateTo('alerts'));
    this.safeBind('btnPortfolio', () => this.navigateTo('portfolio'));
    this.safeBind('btnSettings',  () => this.openSettings());

    // Panel tabs
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchPanel(e.currentTarget.dataset.panel);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  safeBind(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  setupEventSubscriptions() {
    eventBus.on(EventBus.Events.MARKET_DATA_UPDATED, (data) => {
      // Refresh dashboard if it's the active view
      if (stateManager.get('activeView') === 'dashboard') {
        this.loadView('dashboard');
      }
      // Update last-updated time
      const el = document.getElementById('lastUpdated');
      if (el) el.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
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
    // Load market data — non-fatal if it fails
    try {
      const marketData = await apiService.getMarketWatch();
      stateManager.set('stocks', (marketData && marketData.data) || []);
      console.log(`📊 Loaded ${stateManager.get('stocks').length} stocks`);
    } catch (error) {
      console.warn('⚠️ Market data unavailable:', error.message);
      stateManager.set('stocks', []);
      this.showToast('Backend unreachable. Running in offline mode.', 'warning');
    }

    // Safely call component data loaders if they exist
    this.safeCall(this.components.watchlist, 'loadWatchlist');
    this.safeCall(this.components.portfolio, 'loadPortfolio');
    this.safeCall(this.components.alerts,    'loadAlerts');
  }

  safeCall(obj, method, ...args) {
    if (obj && typeof obj[method] === 'function') {
      try { return obj[method](...args); }
      catch (e) { console.warn(`${method} failed:`, e.message); }
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
    if (!contentArea) return;

    try {
      let html = '';
      switch (view) {
        case 'dashboard':
          html = this.renderDashboard();
          break;
        case 'watchlist':
          html = this.components.watchlist.render();
          break;
        case 'charts':
          html = this.components.charts.render();
          break;
        case 'screener':
          html = this.components.screener.render();
          break;
        case 'portfolio':
          html = this.components.portfolio.render();
          break;
        case 'alerts':
          html = this.components.alerts.render();
          break;
        case 'news':
          html = await this.components.news.render();
          break;
        default:
          html = `<div class="card"><div class="card-body"><h2>${this.titleCase(view)}</h2><p>This view is under construction.</p></div></div>`;
      }
      contentArea.innerHTML = html;
    } catch (error) {
      console.error(`Error loading view ${view}:`, error);
      contentArea.innerHTML = `<div class="card"><div class="card-body"><h2>Error</h2><p>Failed to load ${view}.</p></div></div>`;
    }
  }

  titleCase(s) {
    return (s || '').replace(/(^|\s)\S/g, t => t.toUpperCase());
  }

  renderDashboard() {
    const stocks = stateManager.get('stocks') || [];

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

        ${stocks.length === 0 ? `
          <div class="card">
            <div class="card-body" style="text-align:center; padding: 3rem;">
              <i class="fas fa-cloud-rain" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
              <h3>No market data</h3>
              <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                The backend at ${CONFIG.api.baseURL} is not responding.<br>
                Click Refresh once it's available.
              </p>
            </div>
          </div>
        ` : `
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
        `}
      </div>
    `;
  }

  renderTopMovers(type) {
    const stocks = stateManager.get('stocks') || [];
    const sorted = [...stocks]
      .filter(s => type === 'gainers' ? s.change > 0 : s.change < 0)
      .sort((a, b) => type === 'gainers' ? b.change - a.change : a.change - b.change)
      .slice(0, 5);

    if (sorted.length === 0) {
      return `<p style="color: var(--text-muted); padding: 1rem 0;">No ${type} to show.</p>`;
    }

    return sorted.map(stock => `
      <div class="mover-item" onclick="eventBus.emit(EventBus.Events.STOCK_SELECTED, '${stock.symbol}')">
        <div class="mover-info">
          <span class="mover-symbol">${stock.symbol}</span>
          <span class="mover-name">${stock.name}</span>
        </div>
        <div class="mover-price">
          <span class="price">₹${Number(stock.price).toFixed(2)}</span>
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

    if (searchClear) searchClear.style.display = query ? 'block' : 'none';

    if (query.length < 2) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
      return;
    }

    const stocks = stateManager.get('stocks') || [];
    const results = stocks.filter(s =>
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    if (results.length === 0) {
      searchResults.innerHTML = `<div class="search-result-item"><span style="color:var(--text-muted)">No matches for "${query}"</span></div>`;
      searchResults.classList.add('active');
      return;
    }

    searchResults.innerHTML = results.map(stock => `
      <div class="search-result-item" onclick="eventBus.emit(EventBus.Events.STOCK_SELECTED, '${stock.symbol}'); document.getElementById('searchResults').classList.remove('active');">
        <div class="result-symbol">${stock.symbol}</div>
        <div class="result-name">${stock.name}</div>
        <div class="result-price">₹${Number(stock.price).toFixed(2)}</div>
      </div>
    `).join('');

    searchResults.classList.add('active');
  }

  showStockDetails(symbol) {
    // Could open a modal — for now just toast
    this.showToast(`Selected: ${symbol}`, 'info');
  }

  switchPanel(panel) {
    document.querySelectorAll('.panel-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.panel === panel);
    });
    const content = document.getElementById('panelContent');
    if (content) {
      content.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">${this.titleCase(panel)} panel coming soon.</p>`;
    }
  }

  openSettings() {
    this.showToast('Settings panel coming soon.', 'info');
  }

  updateMarketStatus() {
    const now = new Date();
    const [openHour, openMin]  = CONFIG.market.openTime.split(':').map(Number);
    const [closeHour, closeMin] = CONFIG.market.closeTime.split(':').map(Number);

    const marketOpen  = new Date(now); marketOpen.setHours(openHour, openMin, 0);
    const marketClose = new Date(now); marketClose.setHours(closeHour, closeMin, 0);

    const isWeekday = now.getDay() !== 0 && now.getDay() !== 6;
    const isOpen = isWeekday && now >= marketOpen && now <= marketClose;

    stateManager.set('marketStatus', isOpen ? 'OPEN' : 'CLOSED');

    const statusElement = document.getElementById('marketStatus');
    if (!statusElement) return;
    const indicator = statusElement.querySelector('.status-indicator');
    const text      = statusElement.querySelector('.status-text');
    if (indicator) indicator.className = `status-indicator ${isOpen ? 'open' : 'closed'}`;
    if (text)      text.textContent    = isOpen ? 'Market Open' : 'Market Closed';
  }

  updateConnectionStatus(status) {
    const connectionStatus = document.getElementById('connectionStatus');
    if (!connectionStatus) return;
    const icon = connectionStatus.querySelector('i');
    if (icon) {
      icon.className = `fas fa-circle ${status === 'connected' ? 'connected' : 'disconnected'}`;
    }
    // Replace text content safely
    const isConnected = status === 'connected';
    connectionStatus.innerHTML = `<i class="fas fa-circle ${isConnected ? 'connected' : 'disconnected'}"></i> ${isConnected ? 'Connected' : 'Disconnected'}`;
  }

  updateBadges() {
    const watchlist = stateManager.get('watchlist') || [];
    const alerts    = stateManager.get('alerts') || [];
    const wlEl   = document.getElementById('watchlistCount');
    const sbWl   = document.getElementById('sidebarWatchlistCount');
    const alEl   = document.getElementById('alertsCount');
    const sbAl   = document.getElementById('sidebarAlertsCount');
    if (wlEl) wlEl.textContent = watchlist.length;
    if (sbWl) sbWl.textContent = watchlist.length;
    if (alEl) alEl.textContent = alerts.length;
    if (sbAl) sbAl.textContent = alerts.length;
  }

  startPeriodicUpdates() {
    // Update market data on interval
    setInterval(async () => {
      try {
        const data = await apiService.getMarketWatch();
        if (data && data.data) {
          stateManager.set('stocks', data.data);
          eventBus.emit(EventBus.Events.MARKET_DATA_UPDATED, data.data);
        }
      } catch (error) {
        // Quiet failure for periodic refresh
        console.debug('Periodic update skipped:', error.message);
      }
    }, CONFIG.market.refreshInterval);

    // Update market status every 30 seconds
    setInterval(() => this.updateMarketStatus(), 30000);
  }

  async refreshData() {
    this.showToast('Refreshing...', 'info');
    apiService.clearCache();
    await this.loadInitialData();
    await this.loadView(stateManager.get('activeView') || 'dashboard');
    this.showToast('Data refreshed', 'success');
  }

  showLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = show ? 'flex' : 'none';
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
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle'
              : type === 'error'   ? 'exclamation-circle'
              : type === 'warning' ? 'exclamation-triangle'
              :                       'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  handleKeyboardShortcuts(event) {
    // Ctrl+K - Focus search
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      const s = document.getElementById('globalSearch');
      if (s) s.focus();
    }
    // Escape - Clear search
    if (event.key === 'Escape') {
      const s = document.getElementById('globalSearch');
      const r = document.getElementById('searchResults');
      if (s) s.value = '';
      if (r) r.classList.remove('active');
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => { clearTimeout(timeout); func(...args); };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize application when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new DreamShareApp();
  app.initialize();
});
