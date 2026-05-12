// apiService.js - Handles all API calls for Dream Share (Indian Market Focus)

class ApiService {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    }

    // Dream-related endpoints
    async getDreams() {
        return this.request('/dreams');
    }

    async createDream(dreamData) {
        return this.request('/dreams', {
            method: 'POST',
            body: JSON.stringify(dreamData)
        });
    }

    // Market data endpoints
    async getHistoricalData(symbol, params) {
        console.log(`Fetching historical data for ${symbol}`, params);
        // Replace with real API call to Indian data source
        return this.generateMockData(symbol, params);
    }

    async getRealtimeQuote(symbol) {
        // Mock quote for Indian market
        return {
            symbol,
            price: Math.random() * 5000 + 100,  // Indian stock/index range
            change: (Math.random() - 0.5) * 100,
            timestamp: new Date().toISOString()
        };
    }

    generateMockData(symbol, { from, to, interval, limit = 100 }) {
        const data = [];
        const startTime = new Date(from || Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endTime = new Date(to || Date.now());
        const step = (endTime - startTime) / limit;
        
        // No hardcoded symbols – generate generic Indian market data
        // Use a seed based on symbol name to get consistent fake prices
        let seed = 0;
        for (let i = 0; i < symbol.length; i++) {
            seed += symbol.charCodeAt(i);
        }
        const random = (min, max) => min + (Math.sin(seed) * 0.5 + 0.5) * (max - min);
        
        // Choose a sensible base price range based on symbol type (index vs stock)
        let basePrice;
        const upperSymbol = symbol.toUpperCase();
        if (upperSymbol.includes('NIFTY') || upperSymbol.includes('SENSEX')) {
            basePrice = random(15000, 25000); // Index range (15k–25k)
        } else {
            basePrice = random(100, 5000);     // Stock range
        }
        
        for (let i = 0; i <= limit; i++) {
            const timestamp = new Date(startTime.getTime() + i * step);
            // Simulate realistic movement
            const trend = Math.sin(i * 0.05) * (basePrice * 0.02);
            const noise = (Math.random() - 0.5) * (basePrice * 0.01);
            const close = basePrice + trend + noise;
            data.push({
                timestamp: timestamp.toISOString(),
                open: close - Math.random() * (basePrice * 0.01),
                high: close + Math.random() * (basePrice * 0.015),
                low: close - Math.random() * (basePrice * 0.015),
                close: close,
                volume: Math.random() * 10000000
            });
        }
        return data;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
