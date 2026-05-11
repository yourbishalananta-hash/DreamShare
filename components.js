// ============================================
// MARKETPULSE PRO - UI COMPONENTS
// ============================================

class Components {
  constructor() {
    this.init();
  }
  
  init() {
    this.renderDashboard();
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.navigateTo(view);
      });
    });
    
    // Theme toggle
    document.getElementById('btnTheme')?.addEventListener('click', () => {
      stateManager.toggleTheme();
      const icon = document.querySelector('#btnTheme i');
      icon.className = stateManager.get('theme') === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
    
    // Refresh button
    document.getElementById('btnRefresh')?.addEventListener('click', () => {
      this.refreshData();
    });
    
    // Global search
    const searchInput = document.getElementById('globalSearch');
    searchInput?.addEventListener('input', (e) => this.handleSearch(e));
    
    // Close search on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('searchResults')?.classList.remove('active');
        if (searchInput) searchInput.value = '';
      }
    });
    
    // Close modals on overlay click
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });
    
    // Subscribe to state changes
    stateManager.subscribe('stocks', () => this.renderMarketWatch());
  }
  
  navigateTo(view) {
    stateManager.set('activeView', view);
    
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });
    
    // Render view
    switch(view) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'marketwatch':
        this.renderMarketWatch();
        break;
      case 'watchlist':
        this.renderWatchlist();
        break;
      case 'charts':
        this.renderCharts();
        break;
      case 'screener':
        this.renderScreener();
        break;
      case 'compare':
        this.renderCompare();
        break;
    }
    
    eventBus.emit(EVENTS.VIEW_CHANGED, view);
  }
  
  renderDashboard() {
    const stocks = stateManager.get('stocks');
    const contentArea = document.getElementById('contentArea');
    
    const totalStocks = stocks.length;
    const advancing = stocks.filter(s => s.change > 0).length;
    const declining = stocks.filter(s => s.change < 0).length;
    const unchanged = stocks.filter(s => s.change === 0).length;
    
    contentArea.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-header">
          <h2>Market Dashboard</h2>
          <button class="btn btn-outline" onclick="components.refreshData()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Stocks</div>
            <div class="stat-value">${totalStocks}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Advancing</div>
            <div class="stat-value positive">${advancing}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Declining</div>
            <div class="stat-value negative">${declining}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Unchanged</div>
            <div class="stat-value">${unchanged}</div>
          </div>
        </div>
        
        <div>
          <h3 style="margin-bottom: 1rem;">Market Overview</h3>
          <div class="stock-grid">
            ${stocks.slice(0, 8).map(stock => this.createStockCard(stock)).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  renderMarketWatch() {
    const stocks = stateManager.get('stocks');
    const contentArea = document.getElementById('contentArea');
    
    if (stateManager.get('activeView') !== 'marketwatch') return;
    
    contentArea.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-header">
          <h2>Market Watch</h2>
          <span style="color: var(--neutral-500);">${stocks.length} stocks</span>
        </div>
        <div class="stock-grid">
          ${stocks.map(stock => this.createStockCard(stock)).join('')}
        </div>
      </div>
    `;
  }
  
  renderWatchlist() {
    const watchlist = stateManager.get('watchlist');
    const stocks = stateManager.get('stocks');
    const watchlistStocks = stocks.filter(s => watchlist.includes(s.symbol));
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-header">
          <h2>My Watchlist</h2>
          <span style="color: var(--neutral-500);">${watchlistStocks.length} stocks</span>
        </div>
        ${watchlistStocks.length === 0 ? 
          '<p style="text-align:center; padding:3rem; color: var(--neutral-400);">No stocks in watchlist. Click the star icon on any stock to add it.</p>' :
          `<div class="stock-grid">${watchlistStocks.map(stock => this.createStockCard(stock)).join('')}</div>`
        }
      </div>
    `;
  }
  
  renderCharts() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
      <div class="dashboard">
        <h2>Charts</h2>
        <p style="color: var(--neutral-500);">Select a stock to view charts</p>
        <div style="height: 400px; background: var(--neutral-50); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; margin-top: 1rem;">
          <p style="color: var(--neutral-400);">Chart will appear here</p>
        </div>
      </div>
    `;
  }
  
  renderScreener() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
      <div class="dashboard">
        <h2>Stock Screener</h2>
        <p style="color: var(--neutral-500);">Filter stocks by criteria</p>
      </div>
    `;
  }
  
  renderCompare() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
      <div class="dashboard">
        <h2>Compare Stocks</h2>
        <p style="color: var(--neutral-500);">Select stocks to compare</p>
      </div>
    `;
  }
  
  createStockCard(stock) {
    const isPositive = stock.change >= 0;
    const isWatchlisted = stateManager.isInWatchlist(stock.symbol);
    
    return `
      <div class="stock-card" onclick="components.showStockDetails('${stock.symbol}')">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <div class="stock-symbol">${stock.symbol}</div>
            <div class="stock-name">${stock.name || stock.symbol}</div>
          </div>
          <button class="nav-btn" style="width:30px; height:30px;" onclick="event.stopPropagation(); components.toggleWatchlist('${stock.symbol}')" title="${isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}">
            <i class="fas fa-star" style="color: ${isWatchlisted ? '#f59e0b' : '#cbd5e1'}; font-size: 0.8rem;"></i>
          </button>
        </div>
        <div class="stock-details">
          <span class="stock-price">₹${stock.price.toFixed(2)}</span>
          <span class="stock-change ${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '+' : ''}${stock.change.toFixed(2)}%
          </span>
        </div>
        ${stock.rsi ? `
        <div class="stock-rsi">
          <span>RSI: ${stock.rsi}</span>
          <span class="status-tag ${stock.status}">${stock.status}</span>
        </div>` : ''}
      </div>
    `;
  }
  
  toggleWatchlist(symbol) {
    if (stateManager.isInWatchlist(symbol)) {
      stateManager.removeFromWatchlist(symbol);
      this.showToast('Removed from watchlist', 'info');
    } else {
      stateManager.addToWatchlist(symbol);
      this.showToast('Added to watchlist', 'success');
    }
    
    // Refresh current view
    this.navigateTo(stateManager.get('activeView'));
  }
  
  showStockDetails(symbol) {
    const stock = stateManager.get('stocks').find(s => s.symbol === symbol);
    if (!stock) return;
    
    const modal = document.getElementById('modalOverlay');
    const container = document.getElementById('modalContainer');
    
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
        <div>
          <h2>${stock.symbol}</h2>
          <p style="color: var(--neutral-500);">${stock.name || stock.symbol}</p>
        </div>
        <button class="nav-btn" onclick="components.closeModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div style="background: var(--neutral-50); padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span style="font-size: 2rem; font-weight: 700;">₹${stock.price.toFixed(2)}</span>
          <span class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}" style="font-size: 1rem;">
            ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <p><strong>Open:</strong> ₹${stock.price.toFixed(2)}</p>
          <p><strong>High:</strong> ₹${(stock.price * 1.02).toFixed(2)}</p>
          <p><strong>Low:</strong> ₹${(stock.price * 0.98).toFixed(2)}</p>
        </div>
        <div>
          <p><strong>Volume:</strong> ${stock.volume?.toLocaleString() || 'N/A'}</p>
          <p><strong>RSI:</strong> ${stock.rsi || 'N/A'}</p>
          <p><strong>Status:</strong> <span class="status-tag ${stock.status}">${stock.status}</span></p>
        </div>
      </div>
      
      <div style="margin-top: 1.5rem; text-align: center;">
        <button class="btn btn-primary" onclick="components.closeModal()">Close</button>
        <button class="btn btn-outline" onclick="components.toggleWatchlist('${stock.symbol}'); components.closeModal();">
          ${stateManager.isInWatchlist(stock.symbol) ? 'Remove from' : 'Add to'} Watchlist
        </button>
      </div>
    `;
    
    modal.classList.add('active');
  }
  
  closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
  }
  
  handleSearch(event) {
    const query = event.target.value.trim().toLowerCase();
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
      s.symbol.toLowerCase().includes(query) ||
      (s.name && s.name.toLowerCase().includes(query))
    ).slice(0, 10);
    
    searchResults.innerHTML = results.map(stock => `
      <div class="search-result-item" onclick="components.showStockDetails('${stock.symbol}'); document.getElementById('searchResults').classList.remove('active');">
        <div>
          <div style="font-weight:600;">${stock.symbol}</div>
          <div style="font-size:0.8rem; color: var(--neutral-500);">${stock.name || ''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:600;">₹${stock.price.toFixed(2)}</div>
          <div class="${stock.change >= 0 ? 'positive' : 'negative'}" style="font-size:0.8rem;">
            ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
          </div>
        </div>
      </div>
    `).join('');
    
    searchResults.classList.toggle('active', results.length > 0);
  }
  
  async refreshData() {
    try {
      this.showToast('Refreshing data...', 'info');
      const data = await apiService.getMarketWatch();
      stateManager.set('stocks', data.data);
      stateManager.set('lastUpdate', new Date());
      eventBus.emit(EVENTS.MARKET_DATA_LOADED, data.data);
      this.showToast('Data refreshed!', 'success');
    } catch (error) {
      this.showToast('Failed to refresh data', 'error');
    }
  }
  
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
      <i class="fas ${icons[type]}" style="color: var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary-500'});"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  updateConnectionStatus(status) {
    const connectionStatus = document.getElementById('connectionStatus');
    const icon = connectionStatus.querySelector('i');
    
    if (status === 'connected') {
      icon.className = 'fas fa-circle connected';
      connectionStatus.childNodes[1].textContent = ' Connected';
    } else {
      icon.className = 'fas fa-circle disconnected';
      connectionStatus.childNodes[1].textContent = ' Disconnected';
    }
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
    
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (statusIndicator && statusText) {
      statusIndicator.className = `status-indicator ${isOpen ? 'open' : 'closed'}`;
      statusText.textContent = isOpen ? 'Market Open' : 'Market Closed';
    }
    
    // Update market time
    const marketTime = document.getElementById('marketTime');
    if (marketTime) {
      if (isOpen) {
        const timeLeft = new Date(marketClose - now);
        marketTime.textContent = `Closes in: ${timeLeft.getHours()}h ${timeLeft.getMinutes()}m`;
      } else {
        marketTime.textContent = 'Market Closed';
      }
    }
  }
}

// Create global instance
let components;
document.addEventListener('DOMContentLoaded', () => {
  components = new Components();
});
