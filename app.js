// ============================================
// DREAM SHARE - MAIN APPLICATION
// ============================================

class DreamShareApp {
  constructor() {
    this.components = {};
    this.initialized = false;
    this.indices = [];
    this.tableViewState = null; // {category, sortKey, sortDir}
  }

  async initialize() {
    if (this.initialized) return;
    console.log('🚀 Initializing Dream Share...');
    this.showLoading(true);

    try {
      this.initializeServices();
      this.setupEventListeners();

      await this.loadInitialData();

      this.showLoading(false);
      const main = document.getElementById('mainPlatform');
      if (main) main.style.display = 'grid';

      const initialView = stateManager.get('activeView') || 'dashboard';
      await this.loadView(initialView);

      this.updateMarketStatus();
      this.updateBadges();
      this.updateIndicesPanel();
      this.startPeriodicUpdates();

      this.initialized = true;
      console.log('✅ Dream Share initialized successfully');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.showLoading(false);
      const main = document.getElementById('mainPlatform');
      if (main) main.style.display = 'grid';
      this.showToast('Initialization had errors. Some features may not work.', 'error');
      try { await this.loadView('dashboard'); } catch (_) {}
    }
  }

  initializeServices() {
    if (typeof CONFIG !== 'undefined' && CONFIG.features && CONFIG.features.realTimeUpdates
        && typeof webSocketService !== 'undefined') {
      try { webSocketService.connect(); }
      catch (e) { console.warn('WebSocket connection failed:', e.message); }
    }
    this.setupEventSubscriptions();
  }

  setupEventListeners() {
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        if (view) this.navigateTo(view);
      });
    });

    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
    }

    const searchClear = document.getElementById('searchClear');
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        const sr = document.getElementById('searchResults');
        if (sr) sr.classList.remove('active');
        searchClear.style.display = 'none';
      });
    }

    this.safeBind('btnWatchlist', () => this.navigateTo('watchlist'));
    this.safeBind('btnAlerts', () => this.navigateTo('alerts'));
    this.safeBind('btnPortfolio', () => this.navigateTo('portfolio'));
    this.safeBind('btnSettings', () => this.openSettings());

    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchPanel(e.currentTarget.dataset.panel));
    });

    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  safeBind(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  setupEventSubscriptions() {
    if (typeof eventBus === 'undefined' || typeof EventBus === 'undefined') return;

    eventBus.on(EventBus.Events.MARKET_DATA_UPDATED, () => {
      // Re-render only if the active view is dashboard or one of the top-list tables
      const view = stateManager.get('activeView');
      if (view === 'dashboard') this.renderDashboardSections();
      else if (view === 'top-list') this.renderTopListContent();
      this.updateIndicesPanel();
      const el = document.getElementById('lastUpdated');
      if (el) el.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    });

    eventBus.on(EventBus.Events.STOCK_SELECTED, (symbol) => {
      stateManager.set('activeSymbol', symbol);
      this.showStockDetails(symbol);
    });

    eventBus.on(EventBus.Events.CONNECTION_CHANGED, (status) => this.updateConnectionStatus(status));
    eventBus.on(EventBus.Events.ERROR_OCCURRED, (error) => this.showToast(error.message, 'error'));
  }

  async loadInitialData() {
    try {
      if (typeof apiService === 'undefined') {
        stateManager.set('stocks', []);
        return;
      }
      const [marketData, summary] = await Promise.all([
        apiService.getMarketWatch().catch(() => ({ data: [] })),
        apiService.getMarketSummary().catch(() => ({ indices: [], totals: {} })),
      ]);
      stateManager.set('stocks', (marketData && marketData.data) || []);
      this.indices = (summary && summary.indices) || [];
      console.log(`📊 Loaded ${stateManager.get('stocks').length} stocks, ${this.indices.length} indices`);
    } catch (error) {
      console.warn('⚠️ Market data unavailable:', error.message);
      stateManager.set('stocks', []);
      this.showToast('Backend unreachable. Running in offline mode.', 'warning');
    }
  }

  navigateTo(view, payload) {
    stateManager.set('activeView', view);
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });
    this.loadView(view, payload);
    if (typeof eventBus !== 'undefined' && typeof EventBus !== 'undefined') {
      eventBus.emit(EventBus.Events.VIEW_CHANGED, view);
    }
  }

  async loadView(view, payload) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    try {
      switch (view) {
        case 'dashboard':
          contentArea.innerHTML = this.renderDashboardShell();
          this.renderDashboardSections();
          this.attachDashboardEvents();
          break;

        case 'top-list':
          // payload = { category: 'gainers'|'losers'|'turnover'|'volume' }
          this.tableViewState = {
            category: (payload && payload.category) || 'gainers',
            sortKey: this.defaultSortKeyFor((payload && payload.category) || 'gainers'),
            sortDir: 'desc',
          };
          contentArea.innerHTML = this.renderTopListShell();
          this.renderTopListContent();
          this.attachTopListEvents();
          break;

        case 'charts':
          contentArea.innerHTML = '<div id="charts-container"></div>';
          if (typeof ChartsComponent !== 'undefined') {
            this.components.charts = new ChartsComponent('charts-container', stateManager, apiService);
            this.components.charts.render();
          }
          break;

        case 'watchlist':
          contentArea.innerHTML = '<div id="watchlist-container"></div>';
          if (typeof WatchlistComponent !== 'undefined') {
            this.components.watchlist = new WatchlistComponent('watchlist-container', stateManager);
            this.components.watchlist.render();
          }
          break;

        case 'portfolio':
          contentArea.innerHTML = '<div id="portfolio-container"></div>';
          if (typeof PortfolioComponent !== 'undefined') {
            this.components.portfolio = new PortfolioComponent('portfolio-container', stateManager);
            this.components.portfolio.render();
          }
          break;

        case 'news':
          contentArea.innerHTML = '<div id="news-container"></div>';
          if (typeof NewsComponent !== 'undefined') {
            this.components.news = new NewsComponent('news-container');
            this.components.news.render();
          }
          break;

        case 'screener':
          contentArea.innerHTML = '<div id="screener-container"></div>';
          if (typeof ScreenerComponent !== 'undefined') {
            this.components.screener = new ScreenerComponent('screener-container', stateManager);
            this.components.screener.render();
          }
          break;

        case 'alerts':
          contentArea.innerHTML = '<div id="alerts-container"></div>';
          if (typeof AlertsComponent !== 'undefined') {
            this.components.alerts = new AlertsComponent('alerts-container', stateManager);
            this.components.alerts.render();
          }
          break;

        default:
          contentArea.innerHTML = this.renderComingSoon(view);
      }
    } catch (error) {
      console.error(`Error loading view ${view}:`, error);
      contentArea.innerHTML = `<div class="card"><div class="card-body"><h2>Error</h2><p>Failed to load ${view}.</p></div></div>`;
    }
  }

  // ===== DASHBOARD =====

  renderDashboardShell() {
    return `
      <div class="dashboard">
        <div class="dashboard-header">
          <h1 class="view-title">Market Dashboard</h1>
          <div class="dashboard-actions">
            <button class="btn btn-outline btn-sm" id="dashRefreshBtn">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
        <div id="dashboardSections"></div>
      </div>`;
  }

  renderDashboardSections() {
    const container = document.getElementById('dashboardSections');
    if (!container) return;

    const stocks = stateManager.get('stocks') || [];

    if (stocks.length === 0) {
      const baseURL = (typeof CONFIG !== 'undefined' && CONFIG.api && CONFIG.api.baseURL) || '';
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align:center; padding: 3rem;">
            <i class="fas fa-cloud-rain" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <h3>No market data</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
              The backend at ${baseURL} hasn't returned data yet.<br>
              Click Refresh in a moment, or wait for the server to wake up.
            </p>
          </div>
        </div>`;
      return;
    }

    const advancing = stocks.filter(s => s.change > 0).length;
    const declining = stocks.filter(s => s.change < 0).length;
    const unchanged = stocks.filter(s => s.change === 0).length;

    const gainers = [...stocks].filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
    const losers  = [...stocks].filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
    const turnover = [...stocks].sort((a, b) => (b.turnover || 0) - (a.turnover || 0)).slice(0, 5);
    const active   = [...stocks].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5);

    container.innerHTML = `
      <!-- Market Summary -->
      <section class="dash-section">
        <div class="dash-section-header">
          <h2><i class="fas fa-globe-asia"></i> Market Summary</h2>
        </div>
        <div class="summary-grid">
          ${this.renderIndexCards()}
          ${this.renderTotalsCards(stocks.length, advancing, declining, unchanged)}
        </div>
      </section>

      <!-- 4-column grid of top lists -->
      <div class="top-lists-grid">
        ${this.renderTopListCard('gainers', '📈 Top Gainers', gainers)}
        ${this.renderTopListCard('losers',  '📉 Top Losers',  losers)}
        ${this.renderTopListCard('turnover','💰 Top Turnover', turnover)}
        ${this.renderTopListCard('volume',  '🔥 Most Active', active)}
      </div>
    `;
  }

  renderIndexCards() {
    if (!this.indices || this.indices.length === 0) {
      return `<div class="summary-card card"><div class="card-body"><div class="stat-label">Indices</div><div class="stat-value" style="color:var(--text-muted);font-size:1rem;">Loading…</div></div></div>`;
    }
    return this.indices.map(idx => {
      const positive = idx.change >= 0;
      const cls = positive ? 'positive' : 'negative';
      const arrow = positive ? '▲' : '▼';
      return `
        <div class="summary-card card">
          <div class="card-body">
            <div class="stat-label">${idx.symbol}</div>
            <div class="stat-value">${this.formatNumber(idx.ltp)}</div>
            <div class="stat-change ${cls}">${arrow} ${idx.changeAbs || ''} (${positive ? '+' : ''}${idx.change}%)</div>
          </div>
        </div>`;
    }).join('');
  }

  renderTotalsCards(total, advancing, declining, unchanged) {
    return `
      <div class="summary-card card">
        <div class="card-body">
          <div class="stat-label">Total Stocks</div>
          <div class="stat-value">${total}</div>
          <div class="stat-subline">
            <span class="positive">▲ ${advancing}</span>
            <span class="negative">▼ ${declining}</span>
            <span style="color:var(--text-muted)">● ${unchanged}</span>
          </div>
        </div>
      </div>`;
  }

  renderTopListCard(category, title, items) {
    const rows = items.map(s => {
      const cls = s.change >= 0 ? 'positive' : 'negative';
      return `
        <li class="mover-item" data-symbol="${s.symbol}">
          <div class="mover-info">
            <span class="mover-symbol">${s.symbol}</span>
          </div>
          <div class="mover-price">
            <span class="price">₹${this.formatNumber(s.ltp)}</span>
            <span class="change ${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</span>
          </div>
        </li>`;
    }).join('');

    return `
      <section class="card top-list-card">
        <div class="card-header top-list-header">
          <h3>${title}</h3>
          <button class="btn-link view-more-btn" data-category="${category}">View All →</button>
        </div>
        <ul class="top-list">${rows || `<li style="color:var(--text-muted);padding:1rem;">No data</li>`}</ul>
      </section>`;
  }

  attachDashboardEvents() {
    const refreshBtn = document.getElementById('dashRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshData());

    document.querySelectorAll('.view-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        this.navigateTo('top-list', { category });
      });
    });

    document.querySelectorAll('.mover-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const sym = e.currentTarget.dataset.symbol;
        if (sym && typeof eventBus !== 'undefined') eventBus.emit(EventBus.Events.STOCK_SELECTED, sym);
      });
    });
  }

  // ===== TOP LIST (full sortable table) =====

  renderTopListShell() {
    const titles = {
      gainers: '📈 Top Gainers',
      losers:  '📉 Top Losers',
      turnover:'💰 Top Turnover',
      volume:  '🔥 Most Active',
    };
    const category = this.tableViewState.category;
    return `
      <div class="dashboard">
        <div class="dashboard-header">
          <div>
            <button class="btn-link" id="topListBack">← Back to Dashboard</button>
            <h1 class="view-title">${titles[category] || category}</h1>
          </div>
          <div class="dashboard-actions">
            <div class="top-list-tabs">
              ${['gainers','losers','turnover','volume'].map(c =>
                `<button class="tab-btn ${c===category?'active':''}" data-cat="${c}">${titles[c]}</button>`
              ).join('')}
            </div>
          </div>
        </div>
        <div id="topListContent"></div>
      </div>`;
  }

  defaultSortKeyFor(category) {
    if (category === 'gainers' || category === 'losers') return 'change';
    if (category === 'turnover') return 'turnover';
    if (category === 'volume' || category === 'active') return 'volume';
    return 'change';
  }

  renderTopListContent() {
    const container = document.getElementById('topListContent');
    if (!container || !this.tableViewState) return;

    const { category, sortKey, sortDir } = this.tableViewState;
    const stocks = stateManager.get('stocks') || [];

    let filtered;
    if (category === 'gainers') filtered = stocks.filter(s => s.change > 0);
    else if (category === 'losers') filtered = stocks.filter(s => s.change < 0);
    else filtered = [...stocks];

    filtered.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="card"><div class="card-body" style="padding:2rem;color:var(--text-muted);">No stocks in this category.</div></div>`;
      return;
    }

    const dirIcon = (key) => sortKey !== key ? '' : (sortDir === 'desc' ? ' ▼' : ' ▲');

    container.innerHTML = `
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Symbol</th>
                <th class="sortable" data-sort="ltp">Price${dirIcon('ltp')}</th>
                <th class="sortable" data-sort="changeAbs">Change${dirIcon('changeAbs')}</th>
                <th class="sortable" data-sort="change">% Change${dirIcon('change')}</th>
                <th class="sortable" data-sort="volume">Volume${dirIcon('volume')}</th>
                <th class="sortable" data-sort="turnover">Turnover${dirIcon('turnover')}</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((s, i) => {
                const cls = s.change >= 0 ? 'positive' : 'negative';
                return `
                  <tr data-symbol="${s.symbol}" class="row-clickable">
                    <td>${i + 1}</td>
                    <td><strong>${s.symbol}</strong></td>
                    <td>₹${this.formatNumber(s.ltp)}</td>
                    <td class="${cls}">${s.changeAbs >= 0 ? '+' : ''}${this.formatNumber(s.changeAbs)}</td>
                    <td class="${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</td>
                    <td>${this.formatVolume(s.volume)}</td>
                    <td>₹${this.formatVolume(s.turnover)}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  attachTopListEvents() {
    const back = document.getElementById('topListBack');
    if (back) back.addEventListener('click', () => this.navigateTo('dashboard'));

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.dataset.cat;
        this.tableViewState.category = cat;
        this.tableViewState.sortKey = this.defaultSortKeyFor(cat);
        this.tableViewState.sortDir = 'desc';
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
        // Update title too
        const title = document.querySelector('.view-title');
        const titles = {gainers:'📈 Top Gainers', losers:'📉 Top Losers', turnover:'💰 Top Turnover', volume:'🔥 Most Active'};
        if (title) title.textContent = titles[cat] || cat;
        this.renderTopListContent();
        this.attachTopListEvents();
      });
    });

    document.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.sort;
        if (this.tableViewState.sortKey === key) {
          this.tableViewState.sortDir = this.tableViewState.sortDir === 'desc' ? 'asc' : 'desc';
        } else {
          this.tableViewState.sortKey = key;
          this.tableViewState.sortDir = 'desc';
        }
        this.renderTopListContent();
        this.attachTopListEvents();
      });
    });

    document.querySelectorAll('.row-clickable').forEach(row => {
      row.addEventListener('click', (e) => {
        const sym = e.currentTarget.dataset.symbol;
        if (sym && typeof eventBus !== 'undefined') eventBus.emit(EventBus.Events.STOCK_SELECTED, sym);
      });
    });
  }

  renderComingSoon(view) {
    return `
      <div class="card">
        <div class="card-body" style="text-align:center; padding: 3rem;">
          <i class="fas fa-tools" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h2>${this.titleCase(view)}</h2>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">This view is under construction.</p>
        </div>
      </div>`;
  }

  titleCase(s) { return (s || '').replace(/(^|\s)\S/g, t => t.toUpperCase()); }

  // ===== SEARCH =====

  handleSearch(event) {
    const query = event.target.value.trim();
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    if (searchClear) searchClear.style.display = query ? 'block' : 'none';

    if (query.length < 1) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
      return;
    }

    const stocks = stateManager.get('stocks') || [];
    const q = query.toLowerCase();
    const results = stocks.filter(s => s.symbol.toLowerCase().includes(q)).slice(0, 10);

    if (results.length === 0) {
      searchResults.innerHTML = `<div class="search-result-item"><span style="color:var(--text-muted)">No matches for "${query}"</span></div>`;
      searchResults.classList.add('active');
      return;
    }

    searchResults.innerHTML = results.map(stock => `
      <div class="search-result-item" data-symbol="${stock.symbol}">
        <div class="result-symbol">${stock.symbol}</div>
        <div class="result-price">₹${this.formatNumber(stock.ltp)}</div>
        <div class="result-change ${stock.change >= 0 ? 'positive' : 'negative'}">
          ${stock.change >= 0 ? '+' : ''}${stock.change}%
        </div>
      </div>`).join('');
    searchResults.classList.add('active');

    // Attach click handlers
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const sym = item.dataset.symbol;
        if (sym && typeof eventBus !== 'undefined') {
          eventBus.emit(EventBus.Events.STOCK_SELECTED, sym);
        }
        searchResults.classList.remove('active');
      });
    });
  }

  showStockDetails(symbol) {
    this.showToast(`Selected: ${symbol}`, 'info');
  }

  switchPanel(panel) {
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === panel));
    const content = document.getElementById('panelContent');
    if (!content) return;
    if (panel === 'watchlist') {
      const watchlist = stateManager.get('watchlist') || [];
      if (watchlist.length === 0) {
        content.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">Watchlist is empty. Add stocks from the Watchlist view.</p>`;
      } else {
        const stocks = stateManager.get('stocks') || [];
        content.innerHTML = watchlist.map(sym => {
          const s = stocks.find(x => x.symbol === sym);
          if (!s) return `<div class="panel-item"><strong>${sym}</strong> <span style="color:var(--text-muted)">no data</span></div>`;
          const cls = s.change >= 0 ? 'positive' : 'negative';
          return `<div class="panel-item"><strong>${s.symbol}</strong> <span>₹${s.ltp}</span> <span class="${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</span></div>`;
        }).join('');
      }
    } else {
      content.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">${this.titleCase(panel)} panel coming soon.</p>`;
    }
  }

  openSettings() { this.showToast('Settings panel coming soon.', 'info'); }

  updateMarketStatus() {
    if (typeof CONFIG === 'undefined' || !CONFIG.market) return;
    const now = new Date();
    const [openHour, openMin] = CONFIG.market.openTime.split(':').map(Number);
    const [closeHour, closeMin] = CONFIG.market.closeTime.split(':').map(Number);
    const marketOpen = new Date(now); marketOpen.setHours(openHour, openMin, 0);
    const marketClose = new Date(now); marketClose.setHours(closeHour, closeMin, 0);
    const isWeekday = now.getDay() !== 0 && now.getDay() !== 6;
    const isOpen = isWeekday && now >= marketOpen && now <= marketClose;
    stateManager.set('marketStatus', isOpen ? 'OPEN' : 'CLOSED');

    const statusElement = document.getElementById('marketStatus');
    if (!statusElement) return;
    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('.status-text');
    if (indicator) indicator.className = `status-indicator ${isOpen ? 'open' : 'closed'}`;
    if (text) text.textContent = isOpen ? 'Market Open' : 'Market Closed';
  }

  updateConnectionStatus(status) {
    const connectionStatus = document.getElementById('connectionStatus');
    if (!connectionStatus) return;
    const isConnected = status === 'connected';
    connectionStatus.innerHTML = `<i class="fas fa-circle ${isConnected ? 'connected' : 'disconnected'}"></i> ${isConnected ? 'Connected' : 'Disconnected'}`;
  }

  updateBadges() {
    const watchlist = stateManager.get('watchlist') || [];
    const alerts = stateManager.get('alerts') || [];
    const wlEl = document.getElementById('watchlistCount');
    const sbWl = document.getElementById('sidebarWatchlistCount');
    const alEl = document.getElementById('alertsCount');
    const sbAl = document.getElementById('sidebarAlertsCount');
    if (wlEl) wlEl.textContent = watchlist.length;
    if (sbWl) sbWl.textContent = watchlist.length;
    if (alEl) alEl.textContent = alerts.length;
    if (sbAl) sbAl.textContent = alerts.length;
  }

  updateIndicesPanel() {
    const list = document.getElementById('indicesList');
    if (!list) return;
    if (!this.indices || this.indices.length === 0) return;
    list.innerHTML = this.indices.map(idx => {
      const cls = idx.change >= 0 ? 'positive' : 'negative';
      return `
        <div class="index-item">
          <span class="index-name">${idx.symbol}</span>
          <span class="index-value ${cls}">${this.formatNumber(idx.ltp)}</span>
          <span class="index-change ${cls}">${idx.change >= 0 ? '+' : ''}${idx.change}%</span>
        </div>`;
    }).join('');
  }

  startPeriodicUpdates() {
    if (typeof CONFIG === 'undefined' || !CONFIG.market) return;

    setInterval(async () => {
      try {
        if (typeof apiService === 'undefined') return;
        const [data, summary] = await Promise.all([
          apiService.getMarketWatch().catch(() => null),
          apiService.getMarketSummary().catch(() => null),
        ]);
        if (data && data.data) {
          stateManager.set('stocks', data.data);
          if (typeof eventBus !== 'undefined' && typeof EventBus !== 'undefined') {
            eventBus.emit(EventBus.Events.MARKET_DATA_UPDATED, data.data);
          }
        }
        if (summary && summary.indices) {
          this.indices = summary.indices;
          this.updateIndicesPanel();
        }
      } catch (error) {
        console.debug('Periodic update skipped:', error.message);
      }
    }, CONFIG.market.refreshInterval || 30000);

    setInterval(() => this.updateMarketStatus(), 30000);
  }

  async refreshData() {
    this.showToast('Refreshing...', 'info');
    if (typeof apiService !== 'undefined' && apiService.clearCache) apiService.clearCache();
    await this.loadInitialData();
    const view = stateManager.get('activeView') || 'dashboard';
    if (view === 'dashboard') this.renderDashboardSections();
    else if (view === 'top-list') this.renderTopListContent();
    else await this.loadView(view);
    this.updateIndicesPanel();
    this.showToast('Data refreshed', 'success');
  }

  showLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (el) {
      el.style.display = show ? 'flex' : 'none';
      el.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
    const main = document.getElementById('mainPlatform');
    if (main) main.setAttribute('aria-hidden', show ? 'true' : 'false');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle'
      : type === 'error' ? 'exclamation-circle'
      : type === 'warning' ? 'exclamation-triangle'
      : 'info-circle';
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
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      const s = document.getElementById('globalSearch');
      if (s) s.focus();
    }
    if (event.key === 'Escape') {
      const s = document.getElementById('globalSearch');
      const r = document.getElementById('searchResults');
      if (s) s.value = '';
      if (r) r.classList.remove('active');
    }
  }

  debounce(func, wait) {
    let timeout;
    return function (...args) {
      const later = () => { clearTimeout(timeout); func(...args); };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ===== Formatting helpers =====
  formatNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  formatVolume(n) {
    if (!n) return '—';
    n = Number(n);
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + ' K';
    return n.toString();
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new DreamShareApp();
  app.initialize();
});
