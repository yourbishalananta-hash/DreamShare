// components.js - All UI components for Dream Share (Indian Market)

class ChartsComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;
    this.chart = null;
    this.currentSymbol = 'NIFTY 50'; // Default: Indian market index
    this.currentRange = '1d';

    // NOTE: previously '1m' was duplicated (used for "1 Min" AND "1 Month").
    // Renamed the minute key to '1min' to avoid the object-literal collision
    // that silently dropped the first definition.
    this.ranges = {
      '1min': { label: '1 Min', minutes: 1, limit: 100 },
      '5m':   { label: '5 Min', minutes: 5, limit: 100 },
      '15m':  { label: '15 Min', minutes: 15, limit: 100 },
      '1h':   { label: '1 Hour', minutes: 60, limit: 100 },
      '4h':   { label: '4 Hours', minutes: 240, limit: 100 },
      '1d':   { label: '1 Day', days: 1, limit: 365 },
      '1w':   { label: '1 Week', weeks: 1, limit: 200 },
      '1mon': { label: '1 Month', months: 1, limit: 120 },
      '3m':   { label: '3 Months', months: 3, limit: 120 },
      '1y':   { label: '1 Year', years: 1, limit: 365 },
      '5y':   { label: '5 Years', years: 5, limit: 500 }
    };
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="chart-container">
        <div class="chart-header">
          <h3>📈 Indian Market Charts</h3>
          <div class="time-range-buttons">
            ${this.generateRangeButtons()}
          </div>
          <div class="symbol-input">
            <input type="text" id="chart-symbol" value="${this.currentSymbol}" placeholder="e.g., NIFTY 50, SENSEX, RELIANCE, TCS">
            <button id="update-chart-btn">Update</button>
          </div>
        </div>
        <div class="chart-wrapper">
          <canvas id="price-chart-canvas" width="800" height="400"></canvas>
        </div>
        <div id="chart-loading" style="display:none">Loading data...</div>
      </div>
    `;
    this.attachEvents();
    this.loadChartData();
  }

  generateRangeButtons() {
    let html = '';
    for (const [key, range] of Object.entries(this.ranges)) {
      const activeClass = key === this.currentRange ? 'active' : '';
      html += `<button class="range-btn ${activeClass}" data-range="${key}">${range.label}</button>`;
    }
    return html;
  }

  attachEvents() {
    document.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const range = btn.dataset.range;
        this.currentRange = range;
        this.loadChartData();
        document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const updateBtn = document.getElementById('update-chart-btn');
    const symbolInput = document.getElementById('chart-symbol');
    if (updateBtn && symbolInput) {
      updateBtn.addEventListener('click', () => {
        const newSymbol = symbolInput.value.trim().toUpperCase();
        if (newSymbol) {
          this.currentSymbol = newSymbol;
          this.loadChartData();
        }
      });
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
      const params = this.buildTimeParams();
      const data = await this.apiService.getHistoricalData(this.currentSymbol, params);
      this.renderChart(data || []);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      this.showError('Unable to load data for ' + this.currentSymbol);
    } finally {
      if (loadingDiv) loadingDiv.style.display = 'none';
    }
  }

  buildTimeParams() {
    const range = this.ranges[this.currentRange];
    const now = new Date();
    let startDate = new Date();

    if (range.minutes) {
      startDate.setMinutes(now.getMinutes() - range.minutes * range.limit);
    } else if (range.days) {
      startDate.setDate(now.getDate() - range.days * range.limit);
    } else if (range.weeks) {
      startDate.setDate(now.getDate() - range.weeks * 7 * range.limit);
    } else if (range.months) {
      startDate.setMonth(now.getMonth() - range.months);
    } else if (range.years) {
      startDate.setFullYear(now.getFullYear() - range.years);
    }

    return {
      from: startDate.toISOString(),
      to: now.toISOString(),
      interval: this.getIntervalFromRange(),
      limit: range.limit
    };
  }

  getIntervalFromRange() {
    const rangeMap = {
      '1min': '1min', '5m': '5min', '15m': '15min',
      '1h': '1h', '4h': '4h', '1d': '1d',
      '1w': '1w', '1mon': '1mon', '3m': '1mon',
      '1y': '1d', '5y': '1w'
    };
    return rangeMap[this.currentRange] || '1d';
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

    const labels = data.map(item => new Date(item.timestamp).toLocaleString());
    const prices = data.map(item => item.close);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${this.currentSymbol} (₹)`,
          data: prices,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { title: { display: true, text: 'Time' } },
          y: { title: { display: true, text: 'Price (₹)' } }
        }
      }
    });
  }

  showError(message) {
    const container = this.container;
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'chart-error';
      errorDiv.textContent = message;
      container.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  }

  updateRealtimeData(newDataPoint) {
    if (this.chart) {
      this.chart.data.labels.push(newDataPoint.timestamp);
      this.chart.data.datasets[0].data.push(newDataPoint.price);
      if (this.chart.data.labels.length > 100) {
        this.chart.data.labels.shift();
        this.chart.data.datasets[0].data.shift();
      }
      this.chart.update();
    }
  }
}

class WatchlistComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    // Load existing watchlist from state if present
    this.watchlist = (stateManager && typeof stateManager.get === 'function')
      ? (stateManager.get('watchlist') || [])
      : [];
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="watchlist">
        <h3>📋 Watchlist (Indian Stocks)</h3>
        <ul id="watchlist-items"></ul>
        <input type="text" id="add-symbol" placeholder="Add symbol (e.g., RELIANCE, TCS)">
        <button id="add-watchlist-btn">Add</button>
      </div>
    `;
    this.attachEvents();
    this.refreshList();
  }

  attachEvents() {
    const btn = document.getElementById('add-watchlist-btn');
    const input = document.getElementById('add-symbol');
    if (btn) {
      btn.addEventListener('click', () => {
        const symbol = (input?.value || '').trim().toUpperCase();
        if (symbol && !this.watchlist.includes(symbol)) {
          this.watchlist.push(symbol);
          if (this.stateManager && typeof this.stateManager.set === 'function') {
            this.stateManager.set('watchlist', this.watchlist);
          }
          this.refreshList();
        }
        if (input) input.value = '';
      });
    }
  }

  refreshList() {
    const list = document.getElementById('watchlist-items');
    if (!list) return;
    list.innerHTML = this.watchlist.map(symbol => `<li>${symbol} <button class="remove-symbol" data-symbol="${symbol}">❌</button></li>`).join('');
    document.querySelectorAll('.remove-symbol').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const symbol = btn.dataset.symbol;
        this.watchlist = this.watchlist.filter(s => s !== symbol);
        if (this.stateManager && typeof this.stateManager.set === 'function') {
          this.stateManager.set('watchlist', this.watchlist);
        }
        this.refreshList();
      });
    });
  }
}

class PortfolioComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.portfolio = {};
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="portfolio">
        <h3>💼 Portfolio</h3>
        <table id="portfolio-table">
          <thead><tr><th>Symbol</th><th>Shares</th><th>Avg Price (₹)</th><th>Current (₹)</th><th>P&L (₹)</th></tr></thead>
          <tbody id="portfolio-body"></tbody>
        </table>
      </div>
    `;
    this.refreshTable();
  }

  updatePortfolio(data) {
    this.portfolio = data;
    this.refreshTable();
  }

  refreshTable() {
    const body = document.getElementById('portfolio-body');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="5">Portfolio data will appear here</td></tr>';
  }
}

class NewsComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="news-feed">
        <h3>📰 Indian Market News</h3>
        <ul id="news-list">
          <li>Loading news...</li>
        </ul>
      </div>
    `;
  }

  updateNews(articles) {
    const list = document.getElementById('news-list');
    if (!list) return;
    if (!articles || articles.length === 0) {
      list.innerHTML = '<li>No news available</li>';
      return;
    }
    list.innerHTML = articles.map(article => `<li><a href="${article.url}" target="_blank" rel="noopener">${article.title}</a></li>`).join('');
  }
}

// ============================================
// NEW: Stub components so app.js stops crashing.
// Replace with full implementations when ready.
// ============================================

class ScreenerComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header"><h3>🔍 Stock Screener</h3></div>
        <div class="card-body" style="padding: 2rem;">
          <p style="color: var(--text-secondary);">
            Screener is coming soon. Filter Indian stocks by price, market cap,
            sector, P/E ratio, and more.
          </p>
        </div>
      </div>
    `;
  }
}

class AlertsComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    const alerts = (this.stateManager && this.stateManager.get('alerts')) || [];
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header"><h3>🔔 Price Alerts</h3></div>
        <div class="card-body" style="padding: 2rem;">
          ${alerts.length === 0
            ? '<p style="color: var(--text-secondary);">No active alerts. Create one from any stock detail view.</p>'
            : '<ul>' + alerts.map(a => `<li>${a.symbol} ${a.condition} ₹${a.price}</li>`).join('') + '</ul>'}
        </div>
      </div>
    `;
  }
}

class DreamShareComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="dream-share">
        <h3>✨ Share Your Dream</h3>
        <textarea id="dream-content" placeholder="What did you dream about?" rows="4"></textarea>
        <button id="share-dream-btn">Share Dream</button>
        <div id="dream-feed">
          <h4>Dream Feed</h4>
          <ul id="dream-list"></ul>
        </div>
      </div>
    `;
    this.attachEvents();
  }

  attachEvents() {
    const btn = document.getElementById('share-dream-btn');
    const textarea = document.getElementById('dream-content');
    if (btn) {
      btn.addEventListener('click', () => {
        const content = (textarea?.value || '').trim();
        if (content) {
          console.log('Dream shared:', content);
          if (textarea) textarea.value = '';
          this.addDreamToFeed(content);
        }
      });
    }
  }

  addDreamToFeed(content) {
    const list = document.getElementById('dream-list');
    if (list) {
      const li = document.createElement('li');
      li.textContent = `${new Date().toLocaleString()}: ${content}`;
      list.prepend(li);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ChartsComponent, WatchlistComponent, PortfolioComponent,
    NewsComponent, ScreenerComponent, AlertsComponent, DreamShareComponent
  };
}
