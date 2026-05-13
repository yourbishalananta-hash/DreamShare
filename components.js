// components.js - All UI components for Dream Share (Indian Market)

class ChartsComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;
    this.chart = null;
    this.currentSymbol = 'NIFTY 50';
    this.currentRange = '1mo';

    // These keys match ApiService.TIMEFRAME_MAP. Anything else won't work.
    this.ranges = {
      '1d':  '1 Day',
      '5d':  '5 Days',
      '1mo': '1 Month',
      '3mo': '3 Months',
      '6mo': '6 Months',
      '1y':  '1 Year',
      '5y':  '5 Years',
      'max': 'Max',
    };
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="chart-container card">
        <div class="chart-header">
          <h3><i class="fas fa-chart-line"></i> ${this.currentSymbol}</h3>
          <div class="symbol-input">
            <input type="text" id="chart-symbol" value="${this.currentSymbol}" placeholder="NIFTY 50, SENSEX, RELIANCE, TCS...">
            <button class="btn btn-outline btn-sm" id="update-chart-btn">Update</button>
          </div>
        </div>
        <div class="time-range-buttons">
          ${this.generateRangeButtons()}
        </div>
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
    return Object.entries(this.ranges).map(([key, label]) => {
      const activeClass = key === this.currentRange ? 'active' : '';
      return `<button class="range-btn ${activeClass}" data-range="${key}">${label}</button>`;
    }).join('');
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

    const updateBtn = document.getElementById('update-chart-btn');
    const symbolInput = document.getElementById('chart-symbol');
    if (updateBtn && symbolInput) {
      const updateSymbol = () => {
        const newSymbol = symbolInput.value.trim().toUpperCase();
        if (newSymbol) {
          this.currentSymbol = newSymbol;
          // Update the header label too
          const h3 = this.container.querySelector('.chart-header h3');
          if (h3) h3.innerHTML = `<i class="fas fa-chart-line"></i> ${newSymbol}`;
          this.loadChartData();
        }
      };
      updateBtn.addEventListener('click', updateSymbol);
      symbolInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') updateSymbol(); });
    }
  }

  async loadChartData() {
    const loadingDiv = document.getElementById('chart-loading');
    if (loadingDiv) loadingDiv.style.display = 'block';

    try {
      if (!this.apiService || typeof this.apiService.getHistoricalData !== 'function') {
        this.showError('Historical data service unavailable.');
        return;
      }
      const data = await this.apiService.getHistoricalData(
        this.currentSymbol,
        { range: this.currentRange }
      );
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
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
      this.showError('Chart.js is not loaded.');
      return;
    }
    if (this.chart) this.chart.destroy();
    const ctx = canvas.getContext('2d');

    const labels = data.map(item => {
      const d = new Date(item.timestamp);
      // Compact label depending on range
      if (this.currentRange === '1d' || this.currentRange === '5d') {
        return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    });
    const prices = data.map(item => item.close);

    const lineColor = prices[prices.length - 1] >= prices[0] ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    const fillColor = prices[prices.length - 1] >= prices[0] ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${this.currentSymbol}`,
          data: prices,
          borderColor: lineColor,
          backgroundColor: fillColor,
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
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
    errorDiv.style.cssText = 'padding:1rem;color:var(--danger);background:rgba(239,68,68,0.1);border-radius:8px;margin-top:1rem;';
    this.container.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

class WatchlistComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.watchlist = (stateManager && stateManager.get) ? (stateManager.get('watchlist') || []) : [];
  }

  render() {
    if (!this.container) return;
    const stocks = (this.stateManager && this.stateManager.get) ? (this.stateManager.get('stocks') || []) : [];
    const items = this.watchlist.map(sym => {
      const s = stocks.find(x => x.symbol === sym);
      const ltp = s ? `₹${Number(s.ltp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
      const chg = s ? (s.change >= 0 ? `+${s.change}%` : `${s.change}%`) : '';
      const cls = s ? (s.change >= 0 ? 'positive' : 'negative') : '';
      return `
        <li class="watchlist-row">
          <span class="wl-sym">${sym}</span>
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
            <input type="text" id="add-symbol" placeholder="Add symbol (e.g., RELIANCE, TCS, INFY)">
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
    const btn = document.getElementById('add-watchlist-btn');
    const input = document.getElementById('add-symbol');
    const submit = () => {
      const sym = (input?.value || '').trim().toUpperCase();
      if (sym && !this.watchlist.includes(sym)) {
        this.watchlist.push(sym);
        if (this.stateManager?.set) this.stateManager.set('watchlist', this.watchlist);
        this.render();
      }
      if (input) input.value = '';
    };
    if (btn) btn.addEventListener('click', submit);
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

    this.container.querySelectorAll('.remove-symbol').forEach(b => {
      b.addEventListener('click', () => {
        const sym = b.dataset.symbol;
        this.watchlist = this.watchlist.filter(s => s !== sym);
        if (this.stateManager?.set) this.stateManager.set('watchlist', this.watchlist);
        this.render();
      });
    });
  }
}

class PortfolioComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-briefcase"></i> Portfolio</h3></div>
        <div class="card-body" style="padding:2rem;">
          <p style="color:var(--text-secondary)">
            Portfolio tracking is coming soon. You'll be able to log holdings and view real-time P&L.
          </p>
        </div>
      </div>`;
  }
}

class NewsComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-newspaper"></i> Market News</h3></div>
        <div class="card-body" style="padding:2rem;">
          <p style="color:var(--text-secondary)">
            News integration is coming soon. We'll pull headlines for tracked stocks and indices.
          </p>
        </div>
      </div>`;
  }
}

class ScreenerComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    const stocks = (this.stateManager && this.stateManager.get) ? (this.stateManager.get('stocks') || []) : [];
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-filter"></i> Stock Screener</h3>
        </div>
        <div class="card-body">
          <div class="screener-controls">
            <label>Min % Change <input type="number" id="screenMin" value="-100" step="0.1"></label>
            <label>Max % Change <input type="number" id="screenMax" value="100" step="0.1"></label>
            <button class="btn btn-primary btn-sm" id="screenBtn">Filter</button>
          </div>
          <div id="screenResults" style="margin-top:1rem;">
            ${this.renderRows(stocks)}
          </div>
        </div>
      </div>`;
    const btn = document.getElementById('screenBtn');
    if (btn) btn.addEventListener('click', () => {
      const min = parseFloat(document.getElementById('screenMin').value);
      const max = parseFloat(document.getElementById('screenMax').value);
      const filtered = stocks.filter(s => s.change >= min && s.change <= max);
      document.getElementById('screenResults').innerHTML = this.renderRows(filtered);
    });
  }

  renderRows(list) {
    if (!list.length) return '<p style="color:var(--text-muted);padding:1rem;">No stocks match.</p>';
    return `
      <table class="data-table">
        <thead><tr><th>Symbol</th><th>Price</th><th>% Change</th><th>Volume</th></tr></thead>
        <tbody>
          ${list.map(s => {
            const cls = s.change >= 0 ? 'positive' : 'negative';
            return `<tr>
              <td><strong>${s.symbol}</strong></td>
              <td>₹${Number(s.ltp).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
              <td class="${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</td>
              <td>${(s.volume || 0).toLocaleString('en-IN')}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }
}

class AlertsComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    const alerts = (this.stateManager?.get && this.stateManager.get('alerts')) || [];
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-bell"></i> Price Alerts</h3></div>
        <div class="card-body" style="padding:2rem;">
          ${alerts.length === 0
            ? '<p style="color:var(--text-secondary);">No active alerts yet. Alert creation is coming soon.</p>'
            : '<ul>' + alerts.map(a => `<li>${a.symbol} ${a.condition} ₹${a.price}</li>`).join('') + '</ul>'}
        </div>
      </div>`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ChartsComponent, WatchlistComponent, PortfolioComponent,
    NewsComponent, ScreenerComponent, AlertsComponent
  };
}
