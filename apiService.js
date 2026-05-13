// apiService.js - Connects to MarketPulse Pro Enterprise API (FastAPI)

const API_BASE_URL = 'https://dreamstock-backend.onrender.com';

class ApiService {
  constructor() {
    this.ws = null;
    this.wsCallbacks = [];
    this._cache = new Map();
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  // Dashboard endpoints
  async getMarketWatch() {
    return this.getAllStocks(1, 500);
  }

  async getMarketSummary() {
    return this.request('/market/summary');
  }

  async getTop(category, limit = 5) {
    return this.request(`/stocks/top/${category}?limit=${limit}`);
  }

  clearCache() {
    this._cache.clear();
  }

  async getAllStocks(page = 1, limit = 50) {
    return this.request(`/stocks/all?page=${page}&limit=${limit}`);
  }

  // Map our UI timeframe key → valid yfinance (period, interval).
  // Important: yfinance accepts only specific strings; using anything else
  // returns an empty dataframe and the chart goes blank.
  static TIMEFRAME_MAP = {
    '1d':  { period: '1d',  interval: '5m'  },
    '5d':  { period: '5d',  interval: '15m' },
    '1mo': { period: '1mo', interval: '1d'  },
    '3mo': { period: '3mo', interval: '1d'  },
    '6mo': { period: '6mo', interval: '1d'  },
    '1y':  { period: '1y',  interval: '1d'  },
    '5y':  { period: '5y',  interval: '1wk' },
    'max': { period: 'max', interval: '1mo' },
  };

  /**
   * Get historical OHLC data.
   * @param {string} symbol
   * @param {object} params - { range } where range is a key from TIMEFRAME_MAP
   */
  async getHistoricalData(symbol, params = {}) {
    let yfSymbol = symbol;
    if (symbol === 'NIFTY 50' || symbol === 'NIFTY50') yfSymbol = '^NSEI';
    if (symbol === 'SENSEX') yfSymbol = '^BSESN';
    if (symbol === 'BANK NIFTY' || symbol === 'BANKNIFTY') yfSymbol = '^NSEBANK';

    const range = (params.range && ApiService.TIMEFRAME_MAP[params.range])
      ? ApiService.TIMEFRAME_MAP[params.range]
      : ApiService.TIMEFRAME_MAP['1y'];

    const url = `/stocks/${encodeURIComponent(yfSymbol)}/history?period=${range.period}&interval=${range.interval}`;
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

  async getFundamentals(symbol) {
    let yfSymbol = symbol;
    if (symbol === 'NIFTY 50' || symbol === 'NIFTY50') yfSymbol = '^NSEI';
    if (symbol === 'SENSEX') yfSymbol = '^BSESN';
    if (symbol === 'BANK NIFTY' || symbol === 'BANKNIFTY') yfSymbol = '^NSEBANK';
    return this.request(`/stocks/${encodeURIComponent(yfSymbol)}/fundamentals`);
  }

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
      try { data = JSON.parse(event.data); } catch (e) { return; }
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

const apiService = new ApiService();
window.apiService = apiService;
