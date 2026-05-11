// ============================================
// MARKETPULSE PRO - API SERVICE
// ============================================

class APIService {
  constructor() {
    this.baseURL = CONFIG.api.baseURL;
    this.cache = new Map();
    this.pendingRequests = new Map();
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
    
    // Check cache for GET requests
    if ((!options.method || options.method === 'GET') && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < (options.cacheTime || 30000)) {
        return cached.data;
      }
    }
    
    // Deduplicate pending requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }
    
    const requestPromise = this.executeRequest(url, options);
    this.pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const data = await requestPromise;
      
      // Cache successful GET responses
      if (!options.method || options.method === 'GET') {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }
  
  async executeRequest(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.api.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408);
      }
      
      throw error;
    }
  }
  
  // Market Data Endpoints
  async getMarketWatch() {
    return this.request('/stocks/market-watch');
  }
  
  async getStockDetails(symbol) {
    return this.request(`/stocks/${symbol}/details`);
  }
  
  async getStockHistory(symbol, timeframe = '1D', limit = 100) {
    return this.request(`/stocks/${symbol}/history?timeframe=${timeframe}&limit=${limit}`);
  }
  
  async getTechnicalIndicators(symbol) {
    return this.request(`/stocks/${symbol}/technicals`);
  }
  
  // Screener Endpoints
  async getScreenerResults(filters) {
    return this.request('/screener/search', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }
  
  // Portfolio Endpoints
  async getPortfolio() {
    return this.request('/portfolio');
  }
  
  async executeOrder(orderData) {
    return this.request('/orders/execute', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
  
  // News Endpoints
  async getMarketNews(category = 'all') {
    return this.request(`/news?category=${category}`);
  }
  
  clearCache() {
    this.cache.clear();
  }
}

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// Create global API service instance
const apiService = new APIService();
