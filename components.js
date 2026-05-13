// components.js - All UI components for Dream Share (Indian Market)

// ============================================================
// AUTOCOMPLETE — reusable, attaches to any text input
// ============================================================
class Autocomplete {
  /**
   * @param {HTMLInputElement} input
   * @param {Object} opts
   * @param {() => Array} opts.getSource - returns array of {symbol, name, ltp?, change?}
   * @param {(item) => void} opts.onSelect
   * @param {string} [opts.placeholder]
   */
  constructor(input, opts) {
    if (!input) return;
    this.input = input;
    this.getSource = opts.getSource;
    this.onSelect = opts.onSelect || (() => {});
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'autocomplete-dropdown';
    this.activeIndex = -1;
    this.matches = [];

    // Position dropdown relative to input
    const wrap = document.createElement('div');
    wrap.className = 'autocomplete-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    wrap.appendChild(this.dropdown);

    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    input.addEventListener('input', this.onInput.bind(this));
    input.addEventListener('focus', this.onInput.bind(this));
    input.addEventListener('keydown', this.onKey.bind(this));
    input.addEventListener('blur', () => setTimeout(() => this.hide(), 150));
  }

  onInput() {
    const q = (this.input.value || '').trim().toLowerCase();
    const source = this.getSource() || [];
    if (q.length === 0) {
      // Show top 8 by name on empty focus
      this.matches = source.slice(0, 8);
    } else {
      this.matches = source.filter(s => {
        const sym = (s.symbol || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        return sym.includes(q) || name.includes(q);
      }).slice(0, 12);
    }
    this.activeIndex = -1;
    this.render();
  }

  render() {
    if (!this.matches.length) {
      this.dropdown.innerHTML = `<div class="ac-empty">No matches</div>`;
      this.show();
      return;
    }
    this.dropdown.innerHTML = this.matches.map((item, i) => {
      const isIdx = item.isIndex ? '<span class="ac-tag">INDEX</span>' : '';
      const price = (item.ltp != null) ? `<span class="ac-price">₹${Number(item.ltp).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>` : '';
      const chg = (item.change != null)
        ? `<span class="ac-change ${item.change >= 0 ? 'positive' : 'negative'}">${item.change >= 0 ? '+' : ''}${item.change}%</span>`
        : '';
      return `
        <div class="ac-item ${i === this.activeIndex ? 'active' : ''}" data-idx="${i}">
          <div class="ac-left">
            <span class="ac-sym">${item.symbol}</span>
            ${isIdx}
            <span class="ac-name">${item.name || ''}</span>
          </div>
          <div class="ac-right">${price}${chg}</div>
        </div>`;
    }).join('');

    this.dropdown.querySelectorAll('.ac-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault(); // stop blur before click
        this.select(parseInt(el.dataset.idx, 10));
      });
    });
    this.show();
  }

  onKey(e) {
    if (!this.matches.length || !this.dropdown.classList.contains('open')) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % this.matches.length;
      this.render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + this.matches.length) % this.matches.length;
      this.render();
    } else if (e.key === 'Enter') {
      if (this.activeIndex >= 0) {
        e.preventDefault();
        this.select(this.activeIndex);
      }
    } else if (e.key === 'Escape') {
      this.hide();
    }
  }

  select(i) {
    const item = this.matches[i];
    if (!item) return;
    this.input.value = item.symbol;
    this.onSelect(item);
    this.hide();
  }

  show() { this.dropdown.classList.add('open'); }
  hide() { this.dropdown.classList.remove('open'); }
}

// Expose globally so app.js can use it
window.Autocomplete = Autocomplete;


// ============================================================
// CHARTS COMPONENT
// ============================================================
class ChartsComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;
    this.chart = null;
    this.currentSymbol = 'NIFTY 50';
    this.currentRange = '1mo';
    this.ranges = {
      '1d':'1 Day','5d':'5 Days','1mo':'1 Month','3mo':'3 Months',
      '6mo':'6 Months','1y':'1 Year','5y':'5 Years','max':'Max',
    };
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="chart-container card">
        <div class="chart-header">
          <h3 id="chart-title"><i class="fas fa-chart-line"></i> ${this.currentSymbol}</h3>
          <div class="symbol-input">
            <input type="text" id="chart-symbol-input" placeholder="Search RELIANCE, TCS, INFY...">
          </div>
        </div>
        <div class="time-range-buttons">${this.generateRangeButtons()}</div>
        <div class="chart-wrapper" style="position:relative;height:420px;">
          <canvas id="price-chart-canvas"></canvas>
          <div id="chart-loading" class="chart-loading" style="display:none">Loading data…</div>
        </div>
      </div>
    `;
    this.attachEvents();
    this.loadChartData();
  }

  generateRangeButtons() {
    return Object.entries(this.ranges).map(([key, label]) =>
      `<button class="range-btn ${key === this.currentRange ? 'active' : ''}" data-range="${key}">${label}</button>`
    ).join('');
  }

  attachEvents() {
    this.container.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentRange = btn.dataset.range;
        this.container.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadChartData();
      });
    });

    const input = document.getElementById('chart-symbol-input');
    if (input && window.Autocomplete && window.app) {
      new Autocomplete(input, {
        getSource: () => window.app.getAutocompleteSource(),
        onSelect: (item) => {
          this.currentSymbol = item.symbol;
          document.getElementById('chart-title').innerHTML =
            `<i class="fas fa-chart-line"></i> ${item.symbol}`;
          input.value = '';
          this.loadChartData();
        }
      });
    }
  }

  async loadChartData() {
    const loadingDiv = document.getElementById('chart-loading');
    if (loadingDiv) loadingDiv.style.display = 'block';

    try {
      const data = await this.apiService.getHistoricalData(this.currentSymbol, { range: this.currentRange });
      if (!data || data.length === 0) {
        this.showError(`No data available for ${this.currentSymbol} (${this.currentRange}).`);
        if (this.chart) { this.chart.destroy(); this.chart = null; }
        return;
      }
      this.renderChart(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      this.showError(`Unable to load ${this.currentSymbol}: ${error.message}`);
    } finally {
      if (loadingDiv) loadingDiv.style.display = 'none';
    }
  }

  renderChart(data) {
    const canvas = document.getElementById('price-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    if (this.chart) this.chart.destroy();
    const ctx = canvas.getContext('2d');

    const labels = data.map(item => {
      const d = new Date(item.timestamp);
      if (this.currentRange === '1d' || this.currentRange === '5d') {
        return d.toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      }
      return d.toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });
    });
    const prices = data.map(item => item.close);
    const up = prices[prices.length - 1] >= prices[0];
    const lineColor = up ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)';
    const fillColor = up ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)';

    this.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{
        label: this.currentSymbol, data: prices,
        borderColor: lineColor, backgroundColor: fillColor,
        fill: true, tension: 0.2, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
      }]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
          }
        },
        scales: {
          x: { ticks: { maxTicksLimit: 8, autoSkip: true } },
          y: { ticks: { callback: (v) => '₹' + Number(v).toLocaleString('en-IN') } }
        }
      }
    });
  }

  showError(message) {
    if (!this.container) return;
    const existing = this.container.querySelector('.chart-error');
    if (existing) existing.remove();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chart-error';
    errorDiv.textContent = message;
    this.container.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}


// ============================================================
// WATCHLIST COMPONENT (now with autocomplete)
// ============================================================
class WatchlistComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.watchlist = (stateManager && stateManager.get) ? (stateManager.get('watchlist') || []) : [];
  }

  render() {
    if (!this.container) return;
    const stocks = this.stateManager?.get('stocks') || [];
    const items = this.watchlist.map(sym => {
      const s = stocks.find(x => x.symbol === sym);
      const ltp = s ? `₹${Number(s.ltp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
      const chg = s ? (s.change >= 0 ? `+${s.change}%` : `${s.change}%`) : '';
      const cls = s ? (s.change >= 0 ? 'positive' : 'negative') : '';
      return `
        <li class="watchlist-row" data-symbol="${sym}">
          <span class="wl-sym row-clickable" data-symbol="${sym}">${sym}</span>
          <span class="wl-price">${ltp}</span>
          <span class="wl-change ${cls}">${chg}</span>
          <button class="btn-link remove-symbol" data-symbol="${sym}">Remove</button>
        </li>`;
    }).join('');

    this.container.innerHTML = `
      <div class="card watchlist">
        <div class="card-header"><h3><i class="fas fa-star"></i> Watchlist</h3></div>
        <div class="card-body">
          <div class="watchlist-add">
            <input type="text" id="add-symbol" placeholder="Search to add a stock...">
            <button class="btn btn-primary btn-sm" id="add-watchlist-btn">Add</button>
          </div>
          <ul class="watchlist-list">
            ${items || '<li style="color:var(--text-muted);padding:1rem;">Your watchlist is empty.</li>'}
          </ul>
        </div>
      </div>`;
    this.attachEvents();
  }

  attachEvents() {
    const input = document.getElementById('add-symbol');
    const btn = document.getElementById('add-watchlist-btn');

    if (input && window.Autocomplete && window.app) {
      new Autocomplete(input, {
        getSource: () => window.app.getAutocompleteSource(),
        onSelect: (item) => {
          this.addSymbol(item.symbol);
          input.value = '';
        }
      });
    }

    const add = () => {
      const sym = (input?.value || '').trim().toUpperCase();
      if (sym) this.addSymbol(sym);
    };
    if (btn) btn.addEventListener('click', add);
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

    this.container.querySelectorAll('.remove-symbol').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = b.dataset.symbol;
        this.watchlist = this.watchlist.filter(s => s !== sym);
        if (this.stateManager?.set) this.stateManager.set('watchlist', this.watchlist);
        this.render();
      });
    });

    this.container.querySelectorAll('.wl-sym.row-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const sym = el.dataset.symbol;
        if (window.app) window.app.openStockDetail(sym);
      });
    });
  }

  addSymbol(sym) {
    if (sym && !this.watchlist.includes(sym)) {
      this.watchlist.push(sym);
      if (this.stateManager?.set) this.stateManager.set('watchlist', this.watchlist);
      this.render();
    }
  }
}


// ============================================================
// PORTFOLIO — holdings + transactions + sector pie
// Persists to localStorage
// ============================================================
class PortfolioComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;
    this.activeTab = 'holdings';
    this.transactions = this.loadFromStorage('ds_portfolio_txns', []);
    this.sectorMap = this.loadFromStorage('ds_sector_cache', {});
  }

  loadFromStorage(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (_) { return fallback; }
  }
  saveToStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  saveTxns() { this.saveToStorage('ds_portfolio_txns', this.transactions); }

  /** Aggregate transactions into current holdings */
  computeHoldings() {
    const holdings = {};
    for (const t of this.transactions) {
      const h = holdings[t.symbol] = holdings[t.symbol] || { symbol: t.symbol, qty: 0, invested: 0 };
      if (t.type === 'BUY') {
        h.qty += t.qty;
        h.invested += t.qty * t.price;
      } else { // SELL
        if (h.qty > 0) {
          const avgCost = h.invested / h.qty;
          h.invested -= avgCost * Math.min(t.qty, h.qty);
        }
        h.qty -= t.qty;
      }
    }
    // Drop zeroed-out positions
    return Object.values(holdings).filter(h => h.qty > 0).map(h => ({
      ...h,
      avgPrice: h.qty > 0 ? h.invested / h.qty : 0,
    }));
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card portfolio-card">
        <div class="card-header">
          <h3><i class="fas fa-briefcase"></i> Portfolio</h3>
          <button class="btn btn-primary btn-sm" id="addTxnBtn"><i class="fas fa-plus"></i> Add Transaction</button>
        </div>
        <div class="portfolio-tabs">
          <button class="ptab ${this.activeTab==='holdings'?'active':''}" data-tab="holdings">Holdings</button>
          <button class="ptab ${this.activeTab==='transactions'?'active':''}" data-tab="transactions">Transactions</button>
          <button class="ptab ${this.activeTab==='allocation'?'active':''}" data-tab="allocation">Sector Allocation</button>
        </div>
        <div class="card-body" id="portfolioBody"></div>
      </div>
    `;
    this.renderBody();
    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelectorAll('.ptab').forEach(b => {
      b.addEventListener('click', () => {
        this.activeTab = b.dataset.tab;
        this.container.querySelectorAll('.ptab').forEach(x => x.classList.toggle('active', x === b));
        this.renderBody();
      });
    });
    const addBtn = document.getElementById('addTxnBtn');
    if (addBtn) addBtn.addEventListener('click', () => this.showAddDialog());
  }

  renderBody() {
    const body = document.getElementById('portfolioBody');
    if (!body) return;
    if (this.activeTab === 'holdings')       body.innerHTML = this.renderHoldings();
    else if (this.activeTab === 'transactions') body.innerHTML = this.renderTransactions();
    else if (this.activeTab === 'allocation') {
      body.innerHTML = `<div id="sectorChartWrap" style="position:relative;height:340px;max-width:540px;margin:0 auto;"><canvas id="sectorPie"></canvas></div><div id="sectorLegend" style="max-width:540px;margin:1rem auto 0;"></div>`;
      this.renderSectorChart();
    }
    this.attachBodyEvents();
  }

  renderHoldings() {
    const holdings = this.computeHoldings();
    if (!holdings.length) {
      return `<div class="empty-state">
        <i class="fas fa-briefcase"></i>
        <p>No holdings yet. Add a transaction to get started.</p>
      </div>`;
    }
    const stocks = this.stateManager?.get('stocks') || [];
    let totalInvested = 0, totalCurrent = 0;
    const rows = holdings.map(h => {
      const live = stocks.find(s => s.symbol === h.symbol);
      const ltp = live ? live.ltp : 0;
      const currentValue = ltp * h.qty;
      const pnl = currentValue - h.invested;
      const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0;
      totalInvested += h.invested;
      totalCurrent += currentValue;
      const cls = pnl >= 0 ? 'positive' : 'negative';
      return `
        <tr class="row-clickable" data-symbol="${h.symbol}">
          <td><strong>${h.symbol}</strong></td>
          <td>${h.qty}</td>
          <td>₹${this._fmt(h.avgPrice)}</td>
          <td>${ltp ? '₹' + this._fmt(ltp) : '—'}</td>
          <td>₹${this._fmt(currentValue)}</td>
          <td class="${cls}">₹${this._fmt(pnl)}</td>
          <td class="${cls}">${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%</td>
        </tr>`;
    }).join('');

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const cls = totalPnL >= 0 ? 'positive' : 'negative';

    return `
      <div class="portfolio-totals">
        <div class="ptotal"><div class="ptotal-label">Invested</div><div class="ptotal-value">₹${this._fmt(totalInvested)}</div></div>
        <div class="ptotal"><div class="ptotal-label">Current</div><div class="ptotal-value">₹${this._fmt(totalCurrent)}</div></div>
        <div class="ptotal"><div class="ptotal-label">Total P&L</div><div class="ptotal-value ${cls}">₹${this._fmt(totalPnL)} (${totalPnL >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%)</div></div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Symbol</th><th>Qty</th><th>Avg Cost</th><th>LTP</th>
            <th>Current Value</th><th>P&L (₹)</th><th>P&L %</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  renderTransactions() {
    if (!this.transactions.length) {
      return `<div class="empty-state">
        <i class="fas fa-history"></i>
        <p>No transactions recorded yet.</p>
      </div>`;
    }
    const sorted = [...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const rows = sorted.map(t => `
      <tr>
        <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
        <td><strong>${t.symbol}</strong></td>
        <td><span class="txn-badge ${t.type === 'BUY' ? 'buy' : 'sell'}">${t.type}</span></td>
        <td>${t.qty}</td>
        <td>₹${this._fmt(t.price)}</td>
        <td>₹${this._fmt(t.qty * t.price)}</td>
        <td><button class="btn-link txn-del" data-id="${t.id}">Delete</button></td>
      </tr>
    `).join('');
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Amount</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  async renderSectorChart() {
    const holdings = this.computeHoldings();
    const stocks = this.stateManager?.get('stocks') || [];

    if (!holdings.length) {
      const wrap = document.getElementById('sectorChartWrap');
      if (wrap) wrap.innerHTML = `<div class="empty-state"><i class="fas fa-chart-pie"></i><p>Add holdings to see sector allocation.</p></div>`;
      return;
    }

    // Fetch sectors for symbols we don't have cached
    const needed = holdings.filter(h => !this.sectorMap[h.symbol]);
    if (needed.length) {
      const results = await Promise.all(needed.map(h =>
        this.apiService.getFundamentals(h.symbol).catch(() => null)
      ));
      needed.forEach((h, i) => {
        const sector = (results[i] && results[i].sector) || 'Other';
        this.sectorMap[h.symbol] = sector;
      });
      this.saveToStorage('ds_sector_cache', this.sectorMap);
    }

    // Build sector totals by current value
    const sectors = {};
    for (const h of holdings) {
      const live = stocks.find(s => s.symbol === h.symbol);
      const value = (live ? live.ltp : h.avgPrice) * h.qty;
      const sec = this.sectorMap[h.symbol] || 'Other';
      sectors[sec] = (sectors[sec] || 0) + value;
    }

    const labels = Object.keys(sectors);
    const values = Object.values(sectors);
    const total = values.reduce((a, b) => a + b, 0);
    const palette = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#db2777', '#65a30d', '#7c2d12', '#475569'];

    const canvas = document.getElementById('sectorPie');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels, datasets: [{
          data: values,
          backgroundColor: palette.slice(0, labels.length),
          borderColor: '#ffffff', borderWidth: 2,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `${c.label}: ₹${this._fmt(c.parsed)} (${((c.parsed/total)*100).toFixed(1)}%)`
            }
          }
        }
      }
    });

    // Custom legend
    const legend = document.getElementById('sectorLegend');
    if (legend) {
      legend.innerHTML = labels.map((label, i) => `
        <div class="sector-legend-item">
          <span class="sector-dot" style="background:${palette[i]}"></span>
          <span class="sector-label">${label}</span>
          <span class="sector-value">₹${this._fmt(values[i])} (${((values[i]/total)*100).toFixed(1)}%)</span>
        </div>
      `).join('');
    }
  }

  attachBodyEvents() {
    const body = document.getElementById('portfolioBody');
    if (!body) return;

    body.querySelectorAll('.row-clickable').forEach(row => {
      row.addEventListener('click', () => {
        const sym = row.dataset.symbol;
        if (window.app && sym) window.app.openStockDetail(sym);
      });
    });

    body.querySelectorAll('.txn-del').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = b.dataset.id;
        if (!confirm('Delete this transaction?')) return;
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTxns();
        this.renderBody();
      });
    });
  }

  showAddDialog() {
    const overlay = document.getElementById('modalOverlay');
    const container = document.getElementById('modalContainer');
    if (!overlay || !container) return;

    const today = new Date().toISOString().slice(0, 10);
    container.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Transaction</h3>
          <button class="modal-close" id="modalClose">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Symbol</label>
            <input type="text" id="txnSymbol" placeholder="Search RELIANCE, TCS...">
          </div>
          <div class="form-row">
            <label>Type</label>
            <select id="txnType">
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div class="form-row two-col">
            <div>
              <label>Quantity</label>
              <input type="number" id="txnQty" min="1" step="1" placeholder="0">
            </div>
            <div>
              <label>Price per share (₹)</label>
              <input type="number" id="txnPrice" min="0" step="0.01" placeholder="0.00">
            </div>
          </div>
          <div class="form-row">
            <label>Date</label>
            <input type="date" id="txnDate" value="${today}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="modalCancel">Cancel</button>
          <button class="btn btn-primary" id="modalSave">Save</button>
        </div>
      </div>
    `;
    overlay.classList.add('active');

    // Autocomplete for symbol
    const symInput = document.getElementById('txnSymbol');
    if (symInput && window.Autocomplete && window.app) {
      new Autocomplete(symInput, {
        getSource: () => window.app.getAutocompleteSource(),
        onSelect: (item) => {
          symInput.value = item.symbol;
          // Pre-fill price with LTP if available
          const stocks = this.stateManager?.get('stocks') || [];
          const live = stocks.find(s => s.symbol === item.symbol);
          if (live && live.ltp) {
            document.getElementById('txnPrice').value = live.ltp;
          }
        }
      });
    }

    const close = () => overlay.classList.remove('active');
    document.getElementById('modalClose').addEventListener('click', close);
    document.getElementById('modalCancel').addEventListener('click', close);
    document.getElementById('modalSave').addEventListener('click', () => {
      const sym = (symInput.value || '').trim().toUpperCase();
      const type = document.getElementById('txnType').value;
      const qty = parseFloat(document.getElementById('txnQty').value);
      const price = parseFloat(document.getElementById('txnPrice').value);
      const date = document.getElementById('txnDate').value;
      if (!sym || !qty || !price || qty <= 0 || price <= 0) {
        alert('Please fill in all fields with positive values.');
        return;
      }
      this.transactions.push({
        id: 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        symbol: sym, type, qty, price, date,
      });
      this.saveTxns();
      close();
      this.renderBody();
    });
  }

  _fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}


// ============================================================
// MARKET DEPTH — orders tab
// ============================================================
class MarketDepthComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;
    this.symbol = stateManager?.get('activeSymbol') || 'RELIANCE';
    this.depthData = null;
    this.refreshTimer = null;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-exchange-alt"></i> Market Depth</h3>
          <div class="depth-search">
            <input type="text" id="depthSymbolInput" placeholder="Search symbol..." value="${this.symbol}">
          </div>
        </div>
        <div class="card-body" id="depthBody"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div></div>
      </div>
    `;
    this.attachEvents();
    this.loadDepth();
  }

  attachEvents() {
    const input = document.getElementById('depthSymbolInput');
    if (input && window.Autocomplete && window.app) {
      new Autocomplete(input, {
        getSource: () => window.app.getAutocompleteSource(),
        onSelect: (item) => {
          this.symbol = item.symbol;
          input.value = item.symbol;
          this.loadDepth();
        }
      });
    }
  }

  async loadDepth() {
    try {
      this.depthData = await this.apiService.getMarketDepth(this.symbol);
      this.renderDepth();
      // Auto-refresh every 10 seconds
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      this.refreshTimer = setInterval(() => this.refreshSilent(), 10000);
    } catch (e) {
      const body = document.getElementById('depthBody');
      if (body) body.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Unable to load depth for ${this.symbol}.</p></div>`;
    }
  }

  async refreshSilent() {
    try {
      this.depthData = await this.apiService.getMarketDepth(this.symbol);
      this.renderDepth();
    } catch (_) {}
  }

  renderDepth() {
    const body = document.getElementById('depthBody');
    if (!body || !this.depthData) return;
    const { bids, asks, bidTotal, askTotal, ltp, simulated } = this.depthData;

    body.innerHTML = `
      <div class="depth-meta">
        <div><span class="depth-label">Symbol</span><span class="depth-value"><strong>${this.symbol}</strong></span></div>
        <div><span class="depth-label">LTP</span><span class="depth-value">₹${this._fmt(ltp)}</span></div>
      </div>
      ${simulated ? `<div class="depth-note">⚠️ Simulated depth for demo. Live 5-level depth requires a broker API (Zerodha Kite, Upstox, etc.).</div>` : ''}
      <div class="depth-grid">
        <div class="depth-col">
          <h4 class="depth-side-title positive">Bids</h4>
          <table class="data-table depth-table">
            <thead><tr><th>Qty</th><th>Orders</th><th>Bid Price</th></tr></thead>
            <tbody>
              ${bids.map(b => `<tr>
                <td>${b.qty}</td>
                <td>${b.orders}</td>
                <td class="positive"><strong>₹${this._fmt(b.price)}</strong></td>
              </tr>`).join('')}
              <tr class="depth-total"><td>${bidTotal.toLocaleString('en-IN')}</td><td colspan="2">Total Buy Qty</td></tr>
            </tbody>
          </table>
        </div>
        <div class="depth-col">
          <h4 class="depth-side-title negative">Asks</h4>
          <table class="data-table depth-table">
            <thead><tr><th>Ask Price</th><th>Orders</th><th>Qty</th></tr></thead>
            <tbody>
              ${asks.map(a => `<tr>
                <td class="negative"><strong>₹${this._fmt(a.price)}</strong></td>
                <td>${a.orders}</td>
                <td>${a.qty}</td>
              </tr>`).join('')}
              <tr class="depth-total"><td colspan="2">Total Sell Qty</td><td>${askTotal.toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  destroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  _fmt(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}


// ============================================================
// STUBS (kept for compatibility)
// ============================================================
class NewsComponent {
  constructor(containerId) { this.container = document.getElementById(containerId); }
  render() {
    if (!this.container) return;
    this.container.innerHTML = `<div class="card"><div class="card-header"><h3><i class="fas fa-newspaper"></i> Market News</h3></div><div class="card-body" style="padding:2rem;"><p style="color:var(--text-secondary)">News integration is coming soon.</p></div></div>`;
  }
}

class ScreenerComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }
  render() {
    if (!this.container) return;
    const stocks = this.stateManager?.get('stocks') || [];
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-filter"></i> Stock Screener</h3></div>
        <div class="card-body">
          <div class="screener-controls">
            <label>Min % Change <input type="number" id="screenMin" value="-100" step="0.1"></label>
            <label>Max % Change <input type="number" id="screenMax" value="100" step="0.1"></label>
            <button class="btn btn-primary btn-sm" id="screenBtn">Filter</button>
          </div>
          <div id="screenResults" style="margin-top:1rem;">${this._renderRows(stocks)}</div>
        </div>
      </div>`;
    const btn = document.getElementById('screenBtn');
    if (btn) btn.addEventListener('click', () => {
      const min = parseFloat(document.getElementById('screenMin').value);
      const max = parseFloat(document.getElementById('screenMax').value);
      const filtered = stocks.filter(s => s.change >= min && s.change <= max);
      document.getElementById('screenResults').innerHTML = this._renderRows(filtered);
      this._wireRows();
    });
    this._wireRows();
  }
  _wireRows() {
    document.querySelectorAll('#screenResults tr.row-clickable').forEach(r => {
      r.addEventListener('click', () => {
        const sym = r.dataset.symbol;
        if (sym && window.app) window.app.openStockDetail(sym);
      });
    });
  }
  _renderRows(list) {
    if (!list.length) return '<p style="color:var(--text-muted);padding:1rem;">No stocks match.</p>';
    return `<table class="data-table"><thead><tr><th>Symbol</th><th>Price</th><th>% Change</th><th>Volume</th></tr></thead><tbody>${list.map(s => {
      const cls = s.change >= 0 ? 'positive' : 'negative';
      return `<tr class="row-clickable" data-symbol="${s.symbol}"><td><strong>${s.symbol}</strong></td><td>₹${Number(s.ltp).toLocaleString('en-IN', {minimumFractionDigits:2})}</td><td class="${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</td><td>${(s.volume || 0).toLocaleString('en-IN')}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
}

class AlertsComponent {
  constructor(containerId, stateManager) { this.container = document.getElementById(containerId); this.stateManager = stateManager; }
  render() {
    if (!this.container) return;
    const alerts = this.stateManager?.get('alerts') || [];
    this.container.innerHTML = `<div class="card"><div class="card-header"><h3><i class="fas fa-bell"></i> Price Alerts</h3></div><div class="card-body" style="padding:2rem;">${alerts.length === 0 ? '<p style="color:var(--text-secondary);">Alert creation is coming soon.</p>' : ''}</div></div>`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ChartsComponent, WatchlistComponent, PortfolioComponent,
    NewsComponent, ScreenerComponent, AlertsComponent, MarketDepthComponent,
    Autocomplete
  };
}
