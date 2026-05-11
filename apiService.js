// ============================================
// MARKETPULSE PRO - API SERVICE
// ============================================

class APIService {
  constructor() {
    this.baseURL = CONFIG.api.baseURL;
    this.cache = {};
  }
  
  async fetchAPI(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Check cache (valid for 30 seconds)
    const cacheKey = url;
    if (this.cache[cacheKey] && (Date.now() - this.cache[cacheKey].timestamp < 30000)) {
      return this.cache[cacheKey].data;
    }
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG.api.timeout);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the response
      this.cache[cacheKey] = { data, timestamp: Date.now() };
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  async getMarketWatch() {
    return this.fetchAPI('/stocks/market-watch');
  }
  
  async getStockDetails(symbol) {
    return this.fetchAPI(`/stocks/${symbol}/details`);
  }
  
  async getTechnicals(symbol) {
    return this.fetchAPI(`/stocks/${symbol}/technicals`);
  }
  
  clearCache() {
    this.cache = {};
  }
}

// Create global instance
const apiService = new APIService();
