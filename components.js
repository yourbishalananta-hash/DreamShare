// ============================================
// DREAM SHARE - COMPONENTS
// ============================================

class BaseComponent {
  constructor() {
    this.initialized = false;
  }
  init() {
    this.initialized = true;
  }
  render() {
    return `<div class="card"><div class="card-body">Loading component...</div></div>`;
  }
}

// -------- Watchlist --------
class WatchlistComponent extends BaseComponent {
  init() {
    this.items = stateManager.get('watchlist') || [];
    super.init();
  }

  loadWatchlist() {
    this.items = stateManager.get('watchlist') || [];
    const wl = document.getElementById('watchlistCount');
    const sb = document.getElementById('sidebarWatchlistCount');
    if (wl) wl.textContent = this.items.length;
    if (sb) sb.textContent = this.items.length;
  }

  add(symbol) {
    const list = stateManager.get('watchlist') || [];
    if (!list.includes(symbol)) {
      list.push(symbol);
      stateManager.set('watchlist', list);
      this.loadWatchlist();
      eventBus.emit(EventBus.Events.WATCHLIST_UPDATED, list);
    }
  }

  remove(symbol) {
    const list = (stateManager.get('watchlist') || []).filter(s => s !== symbol);
    stateManager.set('watchlist', list);
    this.loadWatchlist();
    eventBus.emit(EventBus.Events.WATCHLIST_UPDATED, list);
  }

  render() {
    const items = stateManager.get('watchlist') || [];
    const stocks = stateManager.get('stocks') || [];

    if (items.length === 0) {
      return `
        <div class="card">
          <div class="card-body" style="text-align:center; padding: 3rem;">
            <i class="fas fa-star" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <h2>My Watchlist</h2>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
              You haven't added any stocks yet.<br>
              Search for a stock and add it to start tracking.
            </p>
          </div>
        </div>
      `;
    }

    const rows = items.map(sym => {
      const s = stocks.find(x => x.symbol === sym) || { symbol: sym, name: sym, price: 0, change: 0 };
      const sign = s.change >= 0 ? '+' : '';
      const cls = s.change >= 0 ? 'positive' : 'negative';
      return `
        <tr onclick="eventBus.emit(EventBus.Events.STOCK_SELECTED, '${s.symbol}')">
          <td><strong>${s.symbol}</strong></td>
          <td>${s.name}</td>
          <td class="text-right">₹${Number(s.price).toFixed(2)}</td>
          <td class="text-right ${cls}">${sign}${s.change}%</td>
          <td class="text-right">
            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); app.components.watchlist.remove('${s.symbol}'); app.loadView('watchlist');">
              <i class="fas fa-times"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="card">
        <div class="card-header"><h2>My Watchlist (${items.length})</h2></div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr><th>Symbol</th><th>Name</th><th class="text-right">Price</th><th class="text-right">Change</th><th></th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// -------- Portfolio --------
class PortfolioComponent extends BaseComponent {
  init() {
    this.data = stateManager.get('portfolio') || { balance: 0, holdings: [], transactions: [] };
    super.init();
  }

  loadPortfolio() {
    this.data = stateManager.get('portfolio') || { balance: 0, holdings: [], transactions: [] };
  }

  render() {
    const p = stateManager.get('portfolio') || { balance: 0, holdings: [], transactions: [] };
    const holdings = p.holdings || [];

    const holdingsRows = holdings.length === 0
      ? `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">No holdings yet</td></tr>`
      : holdings.map(h => `
          <tr>
            <td><strong>${h.symbol}</strong></td>
            <td>${h.name || h.symbol}</td>
            <td class="text-right">${h.quantity}</td>
            <td class="text-right">₹${Number(h.avgPrice).toFixed(2)}</td>
            <td class="text-right">₹${(h.quantity * h.avgPrice).toFixed(2)}</td>
          </tr>
        `).join('');

    return `
      <div class="dashboard">
        <div class="dashboard-header"><h2>Portfolio</h2></div>
        <div class="stats-grid">
          <div class="stat-card card"><div class="card-body">
            <div class="stat-label">Available Balance</div>
            <div class="stat-value">₹${Number(p.balance || 0).toLocaleString('en-IN')}</div>
          </div></div>
          <div class="stat-card card"><div class="card-body">
            <div class="stat-label">Holdings</div>
            <div class="stat-value">${holdings.length}</div>
          </div></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Your Holdings</h3></div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr><th>Symbol</th><th>Name</th><th class="text-right">Qty</th><th class="text-right">Avg Price</th><th class="text-right">Invested</th></tr>
              </thead>
              <tbody>${holdingsRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

// -------- Alerts --------
class AlertsComponent extends BaseComponent {
  init() {
    this.alerts = stateManager.get('alerts') || [];
    super.init();
  }

  loadAlerts() {
    this.alerts = stateManager.get('alerts') || [];
    const al = document.getElementById('alertsCount');
    const sb = document.getElementById('sidebarAlertsCount');
    if (al) al.textContent = this.alerts.length;
    if (sb) sb.textContent = this.alerts.length;
  }

  render() {
    const alerts = stateManager.get('alerts') || [];
    if (alerts.length === 0) {
      return `
        <div class="card">
          <div class="card-body" style="text-align:center; padding: 3rem;">
            <i class="fas fa-bell" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <h2>Price Alerts</h2>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
              No alerts set. Create one to get notified when a stock hits a target.
            </p>
          </div>
        </div>
      `;
    }
    return `
      <div class="card">
        <div class="card-header"><h2>Active Alerts (${alerts.length})</h2></div>
        <div class="card-body">
          ${alerts.map(a => `<div>${a.symbol} → ₹${a.price}</div>`).join('')}
        </div>
      </div>
    `;
  }
}

// -------- Charts --------
class ChartsComponent extends BaseComponent {
  render() {
    return `
      <div class="card">
        <div class="card-body" style="text-align:center; padding: 3rem;">
          <i class="fas fa-chart-line" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h2>Advanced Charts</h2>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">
            Interactive charting is under development. Select a symbol from the search bar to view its details.
          </p>
        </div>
      </div>
    `;
  }
}

// -------- Screener --------
class ScreenerComponent extends BaseComponent {
  render() {
    return `
      <div class="card">
        <div class="card-body" style="text-align:center; padding: 3rem;">
          <i class="fas fa-filter" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h2>Stock Screener</h2>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">
            Filter the market by your own criteria — coming soon.
          </p>
        </div>
      </div>
    `;
  }
}

// -------- News --------
class NewsComponent extends BaseComponent {
  async render() {
    try {
      const result = await apiService.getMarketNews('all');
      const news = (result && result.data) || [];
      if (!news.length) {
        return `<div class="card"><div class="card-body"><h2>Market News</h2><p style="color: var(--text-secondary);">No news available right now.</p></div></div>`;
      }
      return `
        <div class="dashboard">
          <div class="dashboard-header"><h2>Market News</h2></div>
          ${news.slice(0, 10).map(n => `
            <div class="card" style="margin-bottom: 1rem;">
              <div class="card-body">
                <h3 style="margin-bottom: 0.5rem;">
                  ${n.url ? `<a href="${n.url}" target="_blank" rel="noopener" style="color: var(--text-1); text-decoration: none;">${n.title}</a>` : n.title}
                </h3>
                ${n.summary ? `<p style="color: var(--text-secondary); margin-bottom: 0.75rem;">${n.summary}</p>` : ''}
                <small style="color: var(--text-muted);">${n.publisher || ''}${n.publisher && n.publishedAt ? ' · ' : ''}${n.publishedAt || ''}</small>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      return `
        <div class="card">
          <div class="card-body" style="text-align:center; padding: 3rem;">
            <i class="fas fa-newspaper" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <h2>Market News</h2>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
              News service unavailable.<br>
              <small>${e.message}</small>
            </p>
          </div>
        </div>
      `;
    }
  }
}
