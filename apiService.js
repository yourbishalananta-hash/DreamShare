// apiService.js
const API_BASE_URL = 'https://dreamstock-backend.onrender.com';

class ApiService {
  constructor() {
    this.ws = null;
    this.wsCallbacks = [];
    this._cache = new Map();
    this._symbolLibrary = null; // memoized
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

  async getMarketWatch()      { return this.getAllStocks(1, 500); }
  async getMarketSummary()    { return this.request('/market/summary'); }
  async getTop(category, limit = 5) { return this.request(`/stocks/top/${category}?limit=${limit}`); }
  async getAllStocks(page = 1, limit = 50) { return this.request(`/stocks/all?page=${page}&limit=${limit}`); }
  async getStockDetail(symbol) { return this.request(`/stocks/${encodeURIComponent(symbol)}/detail`); }

  /**
   * Returns the master symbol library used by autocomplete.
   * Cached after first fetch since it rarely changes.
   */
  async getSymbolList() {
    if (this._symbolLibrary) return this._symbolLibrary;
    try {
      const res = await this.request('/stocks/symbols');
      this._symbolLibrary = (res && res.symbols) || [];
    } catch (e) {
      this._symbolLibrary = this._fallbackSymbols();
    }
    return this._symbolLibrary;
  }

  _fallbackSymbols() {
    // Offline-safe minimal list
    return [
      { symbol: 'RELIANCE',   name: 'Reliance Industries' },
      { symbol: 'TCS',        name: 'Tata Consultancy Services' },
      { symbol: 'HDFCBANK',   name: 'HDFC Bank' },
      { symbol: 'INFY',       name: 'Infosys' },
      { symbol: 'ICICIBANK',  name: 'ICICI Bank' },
      { symbol: 'NIFTY 50',   name: 'NIFTY 50 Index', isIndex: true },
      { symbol: 'SENSEX',     name: 'BSE SENSEX', isIndex: true },
      { symbol: 'BANK NIFTY', name: 'Bank Nifty', isIndex: true },
    ];
  }

  clearCache() { this._cache.clear(); this._symbolLibrary = null; }

  /**
   * Simulated market depth — 5 bid/ask levels around the LTP.
   * Real depth requires a paid broker feed (Zerodha Kite, Upstox, etc.).
   */
  async getMarketDepth(symbol) {
    const detail = await this.getStockDetail(symbol);
    const ltp = (detail && detail.snapshot && detail.snapshot.ltp) || 0;
    if (!ltp) return null;

    // Generate 5 plausible bid/ask levels with random small spreads
    const tick = ltp >= 1000 ? 0.5 : ltp >= 100 ? 0.05 : 0.01;
    const bids = [];
    const asks = [];
    for (let i = 1; i <= 5; i++) {
      const bidPrice = +(ltp - i * tick * (1 + Math.random())).toFixed(2);
      const askPrice = +(ltp + i * tick * (1 + Math.random())).toFixed(2);
      bids.push({
        price: bidPrice,
        qty: Math.floor(50 + Math.random() * 500) * 10,
        orders: Math.floor(1 + Math.random() * 8),
      });
      asks.push({
        price: askPrice,
        qty: Math.floor(50 + Math.random() * 500) * 10,
        orders: Math.floor(1 + Math.random() * 8),
      });
    }
    return {
      symbol,
      ltp,
      bids,
      asks,
      bidTotal:  bids.reduce((sum, b) => sum + b.qty, 0),
      askTotal:  asks.reduce((sum, a) => sum + a.qty, 0),
      simulated: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Map UI timeframe key -> yfinance (period, interval)
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

async getHistoricalData(symbol, params) {
    const cacheKey = `historical-${symbol}-${params.range || params.interval || '1d'}`;
    
    // Map range to API parameters
    const rangeMap = {
        '1d': { interval: '5m', period: '1d' },
        '5d': { interval: '15m', period: '5d' },
        '1mo': { interval: '1h', period: '1mo' },
        '3mo': { interval: '1d', period: '3mo' },
        '6mo': { interval: '1d', period: '6mo' },
        '1y': { interval: '1d', period: '1y' },
        '2y': { interval: '1wk', period: '2y' },
    };
    
    const rangeConfig = rangeMap[params.range] || { interval: '1d', period: '6mo' };
    
    return this.cacheManager.fetchWithFallback(
        cacheKey,
        async () => {
            // Try API first
            try {
                const response = await fetch(
                    `${this.baseUrl}/stocks/${symbol}/historical?` +
                    `interval=${rangeConfig.interval}&period=${rangeConfig.period}`
                );
                if (response.ok) {
                    const data = await response.json();
                    return this.transformHistoricalData(data);
                }
            } catch (error) {
                console.warn('API historical data failed, using mock:', error);
            }
            
            // Fallback to mock data
            return this.generateMockHistoricalData(symbol, rangeConfig);
        },
        {
            ttl: 300000, // 5 minutes
            maxRetries: 2,
            fallbackToExpired: true
        }
    );
}

generateMockHistoricalData(symbol, rangeConfig) {
    const data = [];
    const basePrice = symbol === 'RELIANCE' ? 2850 : 
                     symbol === 'TCS' ? 3950 : 1500;
    
    // Calculate number of candles based on range
    let numCandles = 100;
    let timeIncrement = 3600000; // 1 hour in ms
    
    switch(rangeConfig.interval) {
        case '5m': numCandles = 78; timeIncrement = 300000; break;  // 1 day of 5-min
        case '15m': numCandles = 130; timeIncrement = 900000; break; // 5 days
        case '1h': numCandles = 163; timeIncrement = 3600000; break;  // 1 month
        case '1d': numCandles = 100; timeIncrement = 86400000; break;  // 3-6 months
        case '1wk': numCandles = 104; timeIncrement = 604800000; break; // 2 years
    }
    
    let price = basePrice;
    
    for (let i = numCandles; i >= 0; i--) {
        const volatility = price * 0.02;
        const change = (Math.random() - 0.5) * volatility;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        const volume = Math.floor(Math.random() * 1000000) + 500000;
        
        data.push({
            timestamp: new Date(Date.now() - i * timeIncrement).toISOString(),
            open,
            high,
            low,
            close,
            volume,
        });
        
        price = close;
    }
    
    return data;
}


  async getFundamentals(symbol) {
    return this.request(`/stocks/${encodeURIComponent(symbol)}/fundamentals`);
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
      let data; try { data = JSON.parse(event.data); } catch (e) { return; }
      if (data.type === 'MARKET_UPDATE' && data.data) {
        const quotes = {};
        Object.keys(data.data).forEach(t => {
          const s = data.data[t]; quotes[s.symbol] = s;
        });
        if (onMessageCallback) onMessageCallback(quotes);
      }
    };
    this.ws.onerror = (err) => console.error('WebSocket error', err);
    this.ws.onclose = () => {
      setTimeout(() => this.connectWebSocket(onMessageCallback), 5000);
    };
  }

  subscribeToQuotes(callback) {
    this.wsCallbacks.push(callback);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket((quotes) => this.wsCallbacks.forEach(cb => cb(quotes)));
    }
  }
}

const apiService = new ApiService();
window.apiService = apiService;
