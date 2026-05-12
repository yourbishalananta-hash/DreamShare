// apiService.js - Connects to MarketPulse Pro Enterprise API (FastAPI)

const API_BASE_URL = 'https://dreamstock-backend.onrender.com'; // Change to your backend URL

class ApiService {
  constructor() {
    this.ws = null;
    this.wsCallbacks = [];
    this._cache = new Map();
  }

  // ========== REST API Methods ==========

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get a snapshot of the market — used by the dashboard.
   * Returns the same shape as getAllStocks: { data: [...] }.
   */
  async getMarketWatch() {
    return this.getAllStocks(1, 500);
  }

  /**
   * Clear any cached responses. Currently a no-op placeholder; real caching
   * can be added later by storing responses in this._cache.
   */
  clearCache() {
    this._cache.clear();
  }

  /**
   * Get historical OHLC data for a symbol.
   * @param {string} symbol - Stock symbol (e.g., "RELIANCE") or index symbol (e.g., "^NSEI")
   * @param {object} params - { from, to, interval, limit } (optional)
   * @returns {Promise<Array>} Array of { timestamp, open, high, low, close, volume }
   */
  async getHistoricalData(symbol, params = {}) {
    // Map common indices to Yahoo Finance symbols
    let yfSymbol = symbol;
    if (symbol === 'NIFTY 50' || symbol === 'NIFTY50') yfSymbol = '^NSEI';
    if (symbol === 'SENSEX') yfSymbol = '^BSESN';

    // Translate our timeframe to Yahoo Finance period/interval
    let period = '1y'; // default
    let interval = '1d';
    if (params.limit) {
      if (params.limit <= 100) period = '1mo';
      if (params.limit <= 30) period = '5d';
      if (params.limit <= 10) period = '1d';
    }
    if (params.interval) interval = params.interval;

    const url = `/stocks/${encodeURIComponent(yfSymbol)}/history?period=${period}&interval=${interval}`;
    const data = await this.request(url);

    if (Array.isArray(data)) {
      return data.map(item => ({
        timestamp: item.Date,
        open: item.Open,
        high: item.High,
        low: item.Low,
        close: item.Close,
        volume: item.Volume
      }));
    }
    return [];
  }

  /**
   * Get real-time quote for a single symbol
   */
  async getRealtimeQuote(symbol) {
    const all = await this.request('/stocks/all?page=1&limit=500');
    const found = all.data.find(s => s.symbol === symbol);
    if (found) {
      return {
        symbol: found.symbol,
        price: found.ltp,
        change: found.change,
        volume: found.volume,
        timestamp: found.timestamp
      };
    }
    return null;
  }

  /**
   * Get paginated list of all stocks (for screener / watchlist)
   */
  async getAllStocks(page = 1, limit = 50) {
    return this.request(`/stocks/all?page=${page}&limit=${limit}`);
  }

  /**
   * Get fundamentals (P/E, market cap, etc.)
   */
  async getFundamentals(symbol) {
    let yfSymbol = symbol;
    if (symbol === 'NIFTY 50' || symbol === 'NIFTY50') yfSymbol = '^NSEI';
    if (symbol === 'SENSEX') yfSymbol = '^BSESN';
    return this.request(`/stocks/${encodeURIComponent(yfSymbol)}/fundamentals`);
  }

  // ========== WebSocket Live Updates ==========

  /**
   * Build the WebSocket URL from API_BASE_URL so it works in production.
   * https://foo.com -> wss://foo.com/ws
   * http://localhost:8000 -> ws://localhost:8000/ws
   */
  _wsUrl() {
    try {
      const u = new URL(API_BASE_URL);
      const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${u.host}/ws`;
    } catch (_) {
      return 'wss://dreamstock-backend.onrender.com/ws';
    }
  }

  connectWebSocket(onMessageCallback) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this._wsUrl());

    this.ws.onopen = () => console.log('WebSocket connected');

    this.ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); }
      catch (e) { return; }

      if (data.type === 'MARKET_UPDATE' && data.data) {
        const quotes = {};
        Object.keys(data.data).forEach(ticker => {
          const stock = data.data[ticker];
          quotes[stock.symbol] = stock;
        });
        if (onMessageCallback) onMessageCallback(quotes);
      }
    };

    this.ws.onerror = (err) => console.error('WebSocket error', err);

    this.ws.onclose = () => {
      console.log('WebSocket closed, reconnecting in 5s...');
      setTimeout(() => this.connectWebSocket(onMessageCallback), 5000);
    };
  }

  subscribeToQuotes(callback) {
    this.wsCallbacks.push(callback);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket((quotes) => {
        this.wsCallbacks.forEach(cb => cb(quotes));
      });
    }
  }
}

// ============================================
// IMPORTANT: Create the global instance so app.js can use `apiService`.
// Without this line, `apiService` is undefined everywhere.
// ============================================
const apiService = new ApiService();
window.apiService = apiService;
