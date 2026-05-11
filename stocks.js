// Comprehensive Stock Database Array (International Markets)
const stockDatabase =[
  // ========== US TECHNOLOGY STOCKS ==========
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", exchange: "NASDAQ", country: "US", basePrice: 187.50 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", exchange: "NASDAQ", country: "US", basePrice: 378.90 },
  { symbol: "GOOGL", name: "Alphabet Inc. (Google)", sector: "Technology", exchange: "NASDAQ", country: "US", basePrice: 141.20 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce", exchange: "NASDAQ", country: "US", basePrice: 178.40 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", exchange: "NASDAQ", country: "US", basePrice: 485.60 },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors", exchange: "NASDAQ", country: "US", basePrice: 902.50 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", exchange: "NASDAQ", country: "US", basePrice: 242.30 },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Entertainment", exchange: "NASDAQ", country: "US", basePrice: 625.80 },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Software", exchange: "NASDAQ", country: "US", basePrice: 538.20 },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Software", exchange: "NYSE", country: "US", basePrice: 278.50 },
  { symbol: "INTC", name: "Intel Corporation", sector: "Semiconductors", exchange: "NASDAQ", country: "US", basePrice: 45.20 },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", exchange: "NASDAQ", country: "US", basePrice: 158.30 },
  { symbol: "CSCO", name: "Cisco Systems Inc.", sector: "Networking", exchange: "NASDAQ", country: "US", basePrice: 52.40 },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Software", exchange: "NYSE", country: "US", basePrice: 125.60 },
  { symbol: "IBM", name: "International Business Machines", sector: "Technology", exchange: "NYSE", country: "US", basePrice: 168.90 },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Semiconductors", exchange: "NASDAQ", country: "US", basePrice: 1320.50 },
  { symbol: "QCOM", name: "QUALCOMM Incorporated", sector: "Semiconductors", exchange: "NASDAQ", country: "US", basePrice: 168.70 },
  { symbol: "TXN", name: "Texas Instruments", sector: "Semiconductors", exchange: "NASDAQ", country: "US", basePrice: 195.30 },
  { symbol: "UBER", name: "Uber Technologies Inc.", sector: "Technology", exchange: "NYSE", country: "US", basePrice: 72.80 },
  { symbol: "PYPL", name: "PayPal Holdings Inc.", sector: "Fintech", exchange: "NASDAQ", country: "US", basePrice: 68.40 },
  
  // ========== US FINANCIAL STOCKS ==========
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Banking", exchange: "NYSE", country: "US", basePrice: 198.40 },
  { symbol: "BAC", name: "Bank of America Corp", sector: "Banking", exchange: "NYSE", country: "US", basePrice: 39.20 },
  { symbol: "WFC", name: "Wells Fargo & Company", sector: "Banking", exchange: "NYSE", country: "US", basePrice: 57.30 },
  { symbol: "GS", name: "Goldman Sachs Group Inc.", sector: "Investment Banking", exchange: "NYSE", country: "US", basePrice: 425.80 },
  { symbol: "MS", name: "Morgan Stanley", sector: "Investment Banking", exchange: "NYSE", country: "US", basePrice: 95.60 },
  { symbol: "V", name: "Visa Inc.", sector: "Financial Services", exchange: "NYSE", country: "US", basePrice: 278.30 },
  { symbol: "MA", name: "Mastercard Inc.", sector: "Financial Services", exchange: "NYSE", country: "US", basePrice: 452.60 },
  { symbol: "AXP", name: "American Express Company", sector: "Financial Services", exchange: "NYSE", country: "US", basePrice: 238.40 },
  
  // ========== US HEALTHCARE STOCKS ==========
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", exchange: "NYSE", country: "US", basePrice: 156.80 },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Pharmaceuticals", exchange: "NYSE", country: "US", basePrice: 28.50 },
  { symbol: "MRNA", name: "Moderna Inc.", sector: "Biotechnology", exchange: "NASDAQ", country: "US", basePrice: 112.30 },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Pharmaceuticals", exchange: "NYSE", country: "US", basePrice: 168.90 },
  { symbol: "MRK", name: "Merck & Co Inc.", sector: "Pharmaceuticals", exchange: "NYSE", country: "US", basePrice: 125.40 },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare Insurance", exchange: "NYSE", country: "US", basePrice: 542.30 },
  
  // ========== US CONSUMER STOCKS ==========
  { symbol: "WMT", name: "Walmart Inc.", sector: "Retail", exchange: "NYSE", country: "US", basePrice: 165.20 },
  { symbol: "KO", name: "The Coca-Cola Company", sector: "Beverages", exchange: "NYSE", country: "US", basePrice: 62.40 },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Beverages", exchange: "NASDAQ", country: "US", basePrice: 175.80 },
  { symbol: "PG", name: "Procter & Gamble Company", sector: "Consumer Goods", exchange: "NYSE", country: "US", basePrice: 162.40 },
  { symbol: "DIS", name: "The Walt Disney Company", sector: "Entertainment", exchange: "NYSE", country: "US", basePrice: 95.40 },
  { symbol: "NKE", name: "Nike Inc.", sector: "Apparel", exchange: "NYSE", country: "US", basePrice: 105.30 },
  { symbol: "SBUX", name: "Starbucks Corporation", sector: "Restaurants", exchange: "NASDAQ", country: "US", basePrice: 92.50 },
  { symbol: "MCD", name: "McDonald's Corporation", sector: "Restaurants", exchange: "NYSE", country: "US", basePrice: 295.40 },
  { symbol: "COST", name: "Costco Wholesale Corporation", sector: "Retail", exchange: "NASDAQ", country: "US", basePrice: 725.60 },
  
  // ========== US ENERGY STOCKS ==========
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Oil & Gas", exchange: "NYSE", country: "US", basePrice: 112.50 },
  { symbol: "CVX", name: "Chevron Corporation", sector: "Oil & Gas", exchange: "NYSE", country: "US", basePrice: 156.80 },
  
  // ========== POPULAR ETFs ==========
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", sector: "ETF", exchange: "NYSE", country: "US", basePrice: 512.40 },
  { symbol: "QQQ", name: "Invesco QQQ Trust (NASDAQ-100)", sector: "ETF", exchange: "NASDAQ", country: "US", basePrice: 438.20 },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF", sector: "ETF", exchange: "NYSE", country: "US", basePrice: 389.50 },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", sector: "ETF", exchange: "NYSE", country: "US", basePrice: 470.30 },
  
  // ========== INDIAN STOCK MARKET (NSE) ==========
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Conglomerate", exchange: "NSE", country: "India", basePrice: 2850.40 },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "Technology", exchange: "NSE", country: "India", basePrice: 3890.60 },
  { symbol: "HDFCBANK", name: "HDFC Bank Limited", sector: "Banking", exchange: "NSE", country: "India", basePrice: 1680.30 },
  { symbol: "INFY", name: "Infosys Limited", sector: "Technology", exchange: "NSE", country: "India", basePrice: 1520.50 },
  { symbol: "TATAMOTORS", name: "Tata Motors Limited", sector: "Automotive", exchange: "NSE", country: "India", basePrice: 980.70 },
  
  // ========== UK STOCKS (LSE) ==========
  { symbol: "HSBA", name: "HSBC Holdings plc", sector: "Banking", exchange: "LSE", country: "UK", basePrice: 635.20 },
  { symbol: "AZN", name: "AstraZeneca PLC", sector: "Pharmaceuticals", exchange: "LSE", country: "UK", basePrice: 10250.00 }
];

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = stockDatabase;
}
